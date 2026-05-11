import { env } from '@/lib/env'

export const appConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  description: 'Ultimate Next.js Fullstack Starter Template',
  version: '0.2.0',
  locale_prefix: 'as-needed',
  root_domain: env.NEXT_PUBLIC_ROOT_DOMAIN,
} as const
