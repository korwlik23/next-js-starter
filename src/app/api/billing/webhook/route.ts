import { NextRequest } from 'next/server'
import { successResponse, serverError } from '@/utils/api'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { CreateAuditLog } from '@/lib/audit'
import { BillingService } from '@/modules/billing/service'

// ─────────────────────────────────────────
// STRIPE WEBHOOK API
// ─────────────────────────────────────────
// POST /api/billing/webhook
// รับ event จาก Stripe → อัปเดต subscription ใน DB
// ⚠️ ต้องตั้ง STRIPE_WEBHOOK_SECRET ใน .env

export async function POST(request: NextRequest) {
  try {
    const raw_body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    // ── Verify Stripe Webhook Signature
    let event: any

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Production: ตรวจสอบ signature จาก Stripe
      try {
        event = stripe.webhooks.constructEvent(
          raw_body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        logger.error('[Stripe Webhook] Signature verification failed', { err })
        return new Response('Webhook signature verification failed', { status: 400 })
      }
    } else {
      // Development: ไม่มี webhook secret → parse JSON ตรง (ไม่ปลอดภัยสำหรับ production)
      logger.warn('[Stripe Webhook] No STRIPE_WEBHOOK_SECRET — skipping signature verification')
      event = JSON.parse(raw_body)
    }

    logger.info(`[Stripe Webhook] Received event: ${event.type}`, { event_id: event.id })

    // ── จัดการ Event ตามประเภท
    switch (event.type) {
      // ─── Checkout สำเร็จ → สร้าง/อัปเดต subscription
      case 'checkout.session.completed': {
        const session = event.data.object
        await BillingService.HandleCheckoutCompleted(session)

        // บันทึก Audit Log
        await CreateAuditLog({
          action: 'BILLING_CHECKOUT_COMPLETED',
          entity: 'Subscription',
          entityId: session.id,
          tenantId: session.metadata?.tenantId,
          metadata: {
            customer: session.customer,
            plan: session.metadata?.plan,
          },
        })
        break
      }

      // ─── Subscription อัปเดต (เปลี่ยนแพลน, ต่ออายุ)
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await BillingService.HandleSubscriptionUpdated(subscription)

        await CreateAuditLog({
          action: 'BILLING_SUBSCRIPTION_UPDATED',
          entity: 'Subscription',
          entityId: subscription.id,
          metadata: { status: subscription.status },
        })
        break
      }

      // ─── Subscription ถูกยกเลิก
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await BillingService.HandleSubscriptionDeleted(subscription)

        await CreateAuditLog({
          action: 'BILLING_SUBSCRIPTION_CANCELED',
          entity: 'Subscription',
          entityId: subscription.id,
        })
        break
      }

      // ─── Invoice ชำระเงินสำเร็จ
      case 'invoice.paid': {
        const invoice = event.data.object
        logger.info('[Stripe Webhook] Invoice paid', {
          invoice_id: invoice.id,
          customer: invoice.customer,
          amount: invoice.amount_paid,
        })
        break
      }

      // ─── Invoice ชำระเงินล้มเหลว
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        logger.warn('[Stripe Webhook] Invoice payment failed', {
          invoice_id: invoice.id,
          customer: invoice.customer,
        })
        // TODO: ส่ง notification แจ้งผู้ใช้ว่าบัตรมีปัญหา
        break
      }

      default:
        logger.debug(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return successResponse(null, 'Webhook processed')
  } catch (error) {
    logger.error('[Stripe Webhook] Processing error', { error })
    return serverError('Webhook processing error')
  }
}
