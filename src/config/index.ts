import { env } from '@/lib/env'

// ============================================================
// APP CONFIG — Ultimate Next.js Starter
// ============================================================

export const appConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  description: 'Ultimate Next.js Fullstack Starter Template',
  version: '1.0.0',
} as const

// ─────────────────────────────────────────
// AUTH CONFIG
// ─────────────────────────────────────────
export const authConfig = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  cookieName: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
  },
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/google/callback',
    '/api/auth/github/callback',
    '/api/health',
    '/api/billing/webhook',
  ],
} as const

// ─────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────
export const features = {
  multiTenant: false,
  registration: true,
  forgotPassword: true,
  darkMode: true,
  i18n: true,
  devTools: process.env.NODE_ENV === 'development',
  trialSystem: true,
  apiKeys: true,
  analytics: true,
  auditLog: true,
  sso: false,
} as const

// ─────────────────────────────────────────
// PAGINATION DEFAULTS
// ─────────────────────────────────────────
export const paginationConfig = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
} as const
