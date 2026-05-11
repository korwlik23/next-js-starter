import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  // App
  NEXT_PUBLIC_APP_NAME: z.string().default('Next.js Starter'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().optional().or(z.literal('')),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Email (Optional - warning if missing during email ops)
  EMAIL_PROVIDER: z.enum(['resend', 'postmark', 'smtp']).optional(),
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  POSTMARK_SERVER_TOKEN: z.string().optional().or(z.literal('')),
  SMTP_HOST: z.string().optional().or(z.literal('')),
  SMTP_PORT: z.string().optional().or(z.literal('')),
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASSWORD: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_FROM_EMAIL: z.string().email().optional().or(z.literal('')),

  // Payment (Optional)
  STRIPE_SECRET_KEY: z.string().optional().or(z.literal('')),
  STRIPE_WEBHOOK_SECRET: z.string().optional().or(z.literal('')),
  STRIPE_PRICE_ID_PRO: z.string().optional().or(z.literal('')),
  STRIPE_PRICE_ID_ENT: z.string().optional().or(z.literal('')),

  // Redis (Rate Limiting)
  REDIS_URL: z.string().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

  // Storage (Optional)
  S3_ENDPOINT: z.string().url().optional().or(z.literal('')),
  S3_REGION: z.string().optional().or(z.literal('')),
  S3_BUCKET: z.string().optional().or(z.literal('')),
  S3_ACCESS_KEY_ID: z.string().optional().or(z.literal('')),
  S3_SECRET_ACCESS_KEY: z.string().optional().or(z.literal('')),
  STORAGE_SIGNING_SECRET: z.string().min(32).optional().or(z.literal('')),
  NEXT_PUBLIC_STORAGE_URL: z.string().url().optional().or(z.literal('')),

  // Observability (Optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  LOG_FORMAT: z.enum(['pretty', 'json']).optional(),
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
