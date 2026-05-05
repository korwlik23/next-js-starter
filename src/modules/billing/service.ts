import { GetStripeClient } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// Billing Service — จัดการ Stripe Subscription
// รองรับ: Checkout, Webhook, Portal, Query
// ────────────────────────────────────────

export class BillingService {
  static async GetTenantIdByUserId(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })
    return user?.tenantId || null
  }
  /**
   * สร้าง Stripe Checkout Session สำหรับอัปเกรดแพลน
   * @param tenant_id - ID ของ tenant ที่ต้องการอัปเกรด
   * @param plan - ชื่อแพลน (pro, enterprise)
   * @param return_url - URL ที่จะ redirect กลับหลังชำระเงิน
   */
  static async CreateCheckoutSession(tenant_id: string, plan: string, return_url: string) {
    // ตรวจสอบว่า Stripe ถูก configure หรือไม่
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env')
    }

    // ดึงข้อมูล tenant พร้อม subscription ปัจจุบัน
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
      include: { subscriptions: true },
    })

    if (!tenant) throw new Error('Tenant not found')

    // Map plan → Stripe Price ID
    const price_map: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_ID_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ID_ENT || '',
    }

    const price_id = price_map[plan]
    if (!price_id) {
      throw new Error(`Invalid plan: ${plan}. Available plans: pro, enterprise`)
    }

    // ดึง Stripe Customer ID ถ้ามีอยู่แล้ว
    const existing_customer_id = tenant.subscriptions?.stripeCustomerId || undefined

    // สร้าง Checkout Session
    const stripe = GetStripeClient()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      ...(existing_customer_id ? { customer: existing_customer_id } : {}),
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${return_url}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?canceled=true`,
      metadata: {
        tenantId: tenant_id,
        plan,
      },
    })

    logger.info('[Billing] Checkout session created', {
      tenant_id,
      plan,
      session_id: session.id,
    })

    return { url: session.url, session_id: session.id }
  }

  /**
   * สร้าง Customer Portal Session สำหรับจัดการ subscription
   * ผู้ใช้สามารถเปลี่ยนแพลน, ยกเลิก, อัปเดตบัตร ได้จาก portal
   */
  static async CreateCustomerPortalSession(tenant_id: string, return_url: string) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured.')
    }

    // ดึง Stripe Customer ID จาก subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant_id },
    })

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this tenant')
    }

    // สร้าง portal session
    const stripe = GetStripeClient()
    const portal_session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url,
    })

    return { url: portal_session.url }
  }

  /**
   * ดึง subscription ปัจจุบันของ tenant
   */
  static async GetSubscription(tenant_id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant_id },
    })

    // ถ้าไม่มี subscription → return ข้อมูล free plan
    if (!subscription) {
      return {
        plan: 'free',
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        stripe_customer_id: null,
      }
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      current_period_start: subscription.currentPeriodStart,
      current_period_end: subscription.currentPeriodEnd,
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      stripe_customer_id: subscription.stripeCustomerId,
    }
  }

  /**
   * จัดการ Webhook Event: checkout.session.completed
   * สร้างหรืออัปเดต Subscription ใน database
   */
  static async HandleCheckoutCompleted(session: Record<string, any>) {
    const tenant_id = session.metadata?.tenantId
    const plan = session.metadata?.plan
    const customer_id = session.customer as string
    const subscription_id = session.subscription as string

    if (!tenant_id || !plan) {
      logger.warn('[Billing] Checkout completed but missing metadata', { session_id: session.id })
      return
    }

    // อัปเดตหรือสร้าง Subscription record
    await prisma.subscription.upsert({
      where: { tenantId: tenant_id },
      create: {
        id: GenerateId(),
        tenantId: tenant_id,
        stripeCustomerId: customer_id,
        stripeSubscriptionId: subscription_id,
        plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        stripeCustomerId: customer_id,
        stripeSubscriptionId: subscription_id,
        plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    // อัปเดต plan ใน Tenant table ด้วย
    await prisma.tenant.update({
      where: { id: tenant_id },
      data: { plan },
    })

    logger.info('[Billing] Subscription activated', { tenant_id, plan, customer_id })
  }

  /**
   * จัดการ Webhook Event: customer.subscription.updated
   * อัปเดตสถานะ subscription เมื่อมีการเปลี่ยนแปลง
   */
  static async HandleSubscriptionUpdated(subscription_event: Record<string, any>) {
    const stripe_subscription_id = subscription_event.id as string
    const status = subscription_event.status as string
    const cancel_at_period_end = subscription_event.cancel_at_period_end as boolean

    // หา subscription ใน DB จาก Stripe Subscription ID
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripe_subscription_id },
    })

    if (!existing) {
      logger.warn('[Billing] Subscription not found in DB', { stripe_subscription_id })
      return
    }

    // อัปเดตสถานะ
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status,
        cancelAtPeriodEnd: cancel_at_period_end,
        currentPeriodStart: subscription_event.current_period_start
          ? new Date(subscription_event.current_period_start * 1000)
          : existing.currentPeriodStart,
        currentPeriodEnd: subscription_event.current_period_end
          ? new Date(subscription_event.current_period_end * 1000)
          : existing.currentPeriodEnd,
      },
    })

    logger.info('[Billing] Subscription updated', {
      subscription_id: existing.id,
      status,
      cancel_at_period_end,
    })
  }

  /**
   * จัดการ Webhook Event: customer.subscription.deleted
   * ยกเลิก subscription — ย้ายกลับไปแพลน free
   */
  static async HandleSubscriptionDeleted(subscription_event: Record<string, any>) {
    const stripe_subscription_id = subscription_event.id as string

    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripe_subscription_id },
    })

    if (!existing) return

    // อัปเดตสถานะเป็น canceled
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: 'canceled' },
    })

    // ย้าย Tenant กลับไป free plan
    await prisma.tenant.update({
      where: { id: existing.tenantId },
      data: { plan: 'free' },
    })

    logger.warn('[Billing] Subscription canceled', {
      tenant_id: existing.tenantId,
      stripe_subscription_id,
    })
  }
}
