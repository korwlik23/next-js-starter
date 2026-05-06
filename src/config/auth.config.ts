import { env } from '@/lib/env'

export const authConfig = {
  accessTokenExpiry: env.JWT_ACCESS_EXPIRES,
  refreshTokenExpiry: env.JWT_REFRESH_EXPIRES,
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
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/auth/google/callback',
    '/api/auth/github/callback',
    '/api/health',
    '/api/billing/webhook',
    '/api/webhooks/stripe',
  ],
} as const
