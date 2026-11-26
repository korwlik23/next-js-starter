import { cookies } from 'next/headers'
import { verifyAccessToken } from './jwt'
import prisma from './prisma'
import type { TokenPayload } from '@/types'
import { authConfig } from '@/config'

/**
 * ตรวจว่า session ที่ access token ผูกอยู่ยังไม่ถูกเพิกถอน
 *
 * access token เป็น JWT ที่ตรวจลายเซ็นได้โดยไม่แตะฐานข้อมูล การออกจากระบบ
 * จึงเคยมีผลเฉพาะกับ refresh token ส่วนใบที่ถูกคัดลอกไว้ก่อนหน้ายังใช้ได้ต่อ
 * จนหมดอายุ การผูก `sid` เข้ากับ refresh-token record ทำให้ปิดหน้าต่างนั้นได้
 *
 * token ที่ออกก่อนการเปลี่ยนแปลงนี้ไม่มี `sid` จึงข้ามการตรวจ เพื่อไม่ให้ผู้ใช้
 * หลุดจากระบบทั้งหมดตอน deploy โดยใบเหล่านั้นหมดอายุเองภายในอายุ access token
 */
async function sessionIsActive(payload: TokenPayload): Promise<boolean> {
  if (!payload.sid) return true

  const session = await prisma.refreshToken.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  })

  return Boolean(session)
}

// ─────────────────────────────────────────
// GET AUTH USER FROM COOKIES (Server Component / Route Handler)
// ─────────────────────────────────────────
export async function getAuthUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authConfig.cookieName.accessToken)?.value
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload) return null

  return (await sessionIsActive(payload)) ? payload : null
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
  const expiredCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }

  cookieStore.set(authConfig.cookieName.accessToken, '', expiredCookieOptions)
  cookieStore.set(authConfig.cookieName.refreshToken, '', expiredCookieOptions)
}
