import { env } from '@/lib/env'

export const billingConfig = {
  provider: 'stripe',
  plans: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic access', '1 Project'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price_id: env.STRIPE_PRICE_ID_PRO,
      price: 29,
      features: ['Priority support', 'Unlimited Projects', 'Team collaboration'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price_id: env.STRIPE_PRICE_ID_ENT,
      price: 99,
      features: ['Custom SLA', 'Dedicated Manager', 'Custom integrations'],
    },
  ],
} as const
