import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function GetStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
      appInfo: {
        name: 'Next.js Starter SaaS',
        version: '0.1.0',
      },
    })
  }

  return stripeClient
}
