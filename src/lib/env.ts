import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // App
  NEXT_PUBLIC_APP_NAME: z.string().default('Next.js Starter'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Email (Optional - warning if missing during email ops)
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_FROM_EMAIL: z.string().email().optional().or(z.literal('')),

  // Payment (Optional)
  STRIPE_SECRET_KEY: z.string().optional().or(z.literal('')),
  STRIPE_WEBHOOK_SECRET: z.string().optional().or(z.literal('')),
  STRIPE_PRICE_ID_PRO: z.string().optional().or(z.literal('')),
  STRIPE_PRICE_ID_ENT: z.string().optional().or(z.literal('')),

  // Redis (Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),
})

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

export const env = parseEnv()
