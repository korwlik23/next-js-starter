import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signAccessToken, signAuthTokens, verifyRefreshToken } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { authConfig } from '@/config'
import type { LoginInput } from '../schema'
import type { TokenPayload } from '@/types'
import { AuthRepository } from '../repository'
import { assertLoginNotLocked, clearLoginFailures, recordLoginFailure } from './login-throttle'
import { createMfaChallenge } from './mfa'
import { BuildTokenPayload, GetUserWithPermissions, issueRefreshToken } from './principal'
import { normalizeEmail } from './tokens'
import type { LoginContext, LoginServiceResult } from './types'

/**
 * ล็อกอินด้วยอีเมลและรหัสผ่าน
 *
 * ผู้ใช้ที่ไม่มีอยู่จริงและรหัสผ่านผิดคืน error เดียวกัน เพื่อไม่ให้ใช้ทดสอบว่า
 * อีเมลใดมีในระบบ ทุกความล้มเหลวถูกนับเข้าเกณฑ์การล็อก
 */
export async function LoginService(
  input_data: LoginInput,
  context: LoginContext = {}
): Promise<LoginServiceResult> {
  const email = normalizeEmail(input_data.email)
  await assertLoginNotLocked(email, context.ipAddress)

  const user = await AuthRepository.findUserByEmail(email)

  if (!user || !user.isActive || user.deletedAt) {
    await recordLoginFailure(email, context.ipAddress)
    throw new Error('AUTH_INVALID_CREDENTIALS')
  }

  const password_match = await bcrypt.compare(input_data.password, user.password)
  if (!password_match) {
    await recordLoginFailure(email, context.ipAddress)
    throw new Error('AUTH_INVALID_CREDENTIALS')
  }

  if (authConfig.requireEmailVerification && !user.emailVerifiedAt) {
    throw new Error('AUTH_EMAIL_NOT_VERIFIED')
  }

  const mfaSetting = await prisma.userMfaSetting.findUnique({ where: { userId: user.id } })
  if (mfaSetting?.enabled) {
    await clearLoginFailures(email, context.ipAddress)
    return createMfaChallenge(user.id, context)
  }

  const user_with_perms = await GetUserWithPermissions(user.id)
  const payload = BuildTokenPayload(user_with_perms)
  const tokens = await signAuthTokens(payload)

  await issueRefreshToken(user.id, tokens.refreshToken)

  await clearLoginFailures(email, context.ipAddress)
  logger.info(`User logged in: ${user.email}`)
  return { tokens, user: payload }
}

/**
 * ออก access token ใหม่จาก refresh token ที่ยังไม่ถูกเพิกถอน
 *
 * สิทธิ์ถูกอ่านใหม่จากฐานข้อมูลทุกครั้ง การถอน role จึงมีผลกับ token รอบถัดไป
 */
export async function RefreshTokenService(
  refresh_token: string
): Promise<{ accessToken: string; user: TokenPayload }> {
  const user_id = await verifyRefreshToken(refresh_token)
  if (!user_id) throw new Error('Invalid refresh token')

  const stored_token = await AuthRepository.findRefreshToken(refresh_token, user_id)
  if (!stored_token) throw new Error('Refresh token expired or revoked')

  const user_with_perms = await GetUserWithPermissions(user_id)
  const payload = BuildTokenPayload(user_with_perms)
  const access_token = await signAccessToken(payload)

  return { accessToken: access_token, user: payload }
}

/**
 * เพิกถอน refresh token
 * ระบุ token เพื่อออกจากระบบเฉพาะเครื่องนั้น ไม่ระบุคือออกจากทุกเครื่อง
 */
export async function LogoutService(user_id: string, refresh_token?: string) {
  if (refresh_token) {
    await prisma.refreshToken.updateMany({
      where: { userId: user_id, token: refresh_token },
      data: { revokedAt: new Date() },
    })
  } else {
    await prisma.refreshToken.updateMany({
      where: { userId: user_id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  logger.info(`User logged out: ${user_id}`)
}
