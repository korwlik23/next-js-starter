import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env')
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia' as any,
  })
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('Stripe webhook secret is not configured')
      return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
    }

    const stripe = getStripeClient()
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Retrieve subscription info
        const tenantId = session.metadata?.tenantId ?? session.client_reference_id
        const plan = session.metadata?.plan ?? 'pro'

        if (session.subscription && tenantId) {
          const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
          )) as any

          await prisma.subscription.upsert({
            where: { tenantId },
            create: {
              id: `sub_${tenantId}`,
              tenantId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              plan,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              plan,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })

          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan },
          })
          logger.info(`Subscription completed for tenant: ${tenantId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        if (invoice.subscription) {
          const subscription = (await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )) as any

          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
          logger.info(`Invoice payment succeeded for subscription: ${subscription.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        if (invoice.subscription) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: 'past_due' },
          })
          logger.warn(`Invoice payment failed for subscription: ${invoice.subscription}`)
          // TODO: Send email notification to user
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            plan: (subscription as any).plan?.id || 'pro', // หรือใช้ metadata ถ้ามี
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        })
        logger.info(`Subscription updated: ${subscription.id} (Status: ${subscription.status})`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        })

        // Downgrade tenant to free plan
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { tenantId: true },
        })
        if (sub) {
          await prisma.tenant.update({
            where: { id: sub.tenantId },
            data: { plan: 'free' },
          })
        }

        logger.info(`Subscription deleted: ${subscription.id}`)
        break
      }

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error(`Webhook Error: ${error.message}`)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
