import { cookies } from 'next/headers'
import { verifyAccessToken } from './jwt'
import type { TokenPayload } from '@/types'
import { authConfig } from '@/config'

// ─────────────────────────────────────────
// GET AUTH USER FROM COOKIES (Server Component / Route Handler)
// ─────────────────────────────────────────
export async function getAuthUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authConfig.cookieName.accessToken)?.value
  if (!token) return null
  return verifyAccessToken(token)
}

// ─────────────────────────────────────────
// GET AUTH USER FROM REQUEST (Middleware / Route Handler)
// ─────────────────────────────────────────
export async function getAuthUserFromRequest(request: Request): Promise<TokenPayload | null> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const tokenMatch = cookieHeader.match(new RegExp(`${authConfig.cookieName.accessToken}=([^;]+)`))
  if (!tokenMatch) return null
  return verifyAccessToken(tokenMatch[1])
}

// ─────────────────────────────────────────
// SET AUTH COOKIES
// ─────────────────────────────────────────
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  cookieStore.set(authConfig.cookieName.accessToken, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  })

  cookieStore.set(authConfig.cookieName.refreshToken, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

// ─────────────────────────────────────────
// CLEAR AUTH COOKIES
// ─────────────────────────────────────────
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(authConfig.cookieName.accessToken)
  cookieStore.delete(authConfig.cookieName.refreshToken)
}
