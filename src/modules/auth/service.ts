import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signAuthTokens, signAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { inngest } from '@/lib/inngest'
import { GenerateId } from '@/lib/ulid'
import type { LoginInput, RegisterInput } from './schema'
import type { AuthTokens, TokenPayload } from '@/types'
import { EmailService } from '@/services/email.service'
import type { ForgotPasswordInput, ResetPasswordInput } from './schema'
import { AuthRepository } from './repository'

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
export async function GetUserWithPermissions(user_id: string) {
  return prisma.user.findUnique({
    where: { id: user_id, deletedAt: null },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      permissions: {
        include: { permission: true },
      },
    },
  })
}

export function BuildTokenPayload(
  user: Awaited<ReturnType<typeof GetUserWithPermissions>>
): TokenPayload {
  if (!user) throw new Error('User not found')

  const scoped_roles = user.roles.filter((ur) => {
    if (!user.tenantId) return ur.tenantId == null && ur.role.tenantId == null
    return ur.tenantId === user.tenantId || ur.role.tenantId === user.tenantId
  })

  // Collect role-based permissions
  const role_permissions = scoped_roles.flatMap((ur) =>
    ur.role.permissions.map((rp) => rp.permission.name)
  )
  // Direct override permissions
  const direct_permissions = user.permissions.map((up) => up.permission.name)

  const permissions = [...new Set([...role_permissions, ...direct_permissions])]
  const roles = scoped_roles.map((ur) => ur.role.name)

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    roles,
    permissions,
    tenantId: user.tenantId,
  }
}

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
export async function LoginService(
  input_data: LoginInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const user = await AuthRepository.findUserByEmail(input_data.email)

  if (!user || !user.isActive || user.deletedAt) {
    throw new Error('AUTH_INVALID_CREDENTIALS')
  }

  const password_match = await bcrypt.compare(input_data.password, user.password)
  if (!password_match) {
    throw new Error('AUTH_INVALID_CREDENTIALS')
  }

  const user_with_perms = await GetUserWithPermissions(user.id)
  const payload = BuildTokenPayload(user_with_perms)
  const tokens = await signAuthTokens(payload)

  // Store refresh token in DB
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: {
      id: GenerateId(),
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: expires_at,
    },
  })

  logger.info(`User logged in: ${user.email}`)
  return { tokens, user: payload }
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export async function RegisterService(
  input_data: RegisterInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const existing = await AuthRepository.findUserByEmail(input_data.email)
  if (existing) throw new Error('AUTH_EMAIL_IN_USE')

  const hashed_password = await bcrypt.hash(input_data.password, 12)

  // Get default 'member' role
  const member_role = await prisma.role.findFirst({
    where: { name: 'member', tenantId: null },
  })

  const user = await prisma.user.create({
    data: {
      id: GenerateId(),
      name: input_data.name,
      email: input_data.email,
      password: hashed_password,
      ...(member_role ? { roles: { create: { roleId: member_role.id } } } : {}),
    },
  })

  const user_with_perms = await GetUserWithPermissions(user.id)
  const payload = BuildTokenPayload(user_with_perms)
  const tokens = await signAuthTokens(payload)

  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { id: GenerateId(), userId: user.id, token: tokens.refreshToken, expiresAt: expires_at },
  })

  // Trigger background job (เช่น ส่งอีเมลต้อนรับ)
  await inngest
    .send({
      name: 'app/user.registered',
      data: {
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
      },
    })
    .catch((error) => {
      const missing_event_key =
        error instanceof Error && error.message.includes("couldn't find an event key")

      if (missing_event_key && process.env.NODE_ENV !== 'production') {
        logger.debug('Skipped user registration event; INNGEST_EVENT_KEY is not configured')
        return
      }

      logger.warn('Failed to enqueue user registration event', error)
    })

  logger.info(`New user registered: ${user.email}`)
  return { tokens, user: payload }
}

// ─────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// FORGOT & RESET PASSWORD
// ─────────────────────────────────────────
export async function ForgotPasswordService(input_data: ForgotPasswordInput) {
  const user = await AuthRepository.findUserByEmail(input_data.email)

  // Security: อย่าแจ้งเตือนถ้าไม่มี email นี้ในระบบเพื่อป้องกัน User enumeration
  if (!user || !user.isActive || user.deletedAt) return { success: true }

  // Generate Reset Token
  const token = GenerateId()
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 ชั่วโมง

  // เคลียร์ token เก่าแล้วสร้างใหม่
  await prisma.resetPasswordToken.deleteMany({ where: { email: user.email } })
  await prisma.resetPasswordToken.create({
    data: {
      id: GenerateId(),
      email: user.email,
      token,
      expiresAt: expires_at,
    },
  })

  // ส่งอีเมลโดยใช้ service มาตรฐานของระบบ
  await EmailService.SendPasswordResetEmail(user.email, token)

  logger.info(`Forgot password requested for: ${user.email}`)
  return { success: true }
}

export async function ResetPasswordService(input_data: ResetPasswordInput) {
  const reset_token = await prisma.resetPasswordToken.findUnique({
    where: { token: input_data.token },
  })

  if (!reset_token || reset_token.expiresAt < new Date()) {
    throw new Error('Token ไม่ถูกต้องหรือหมดอายุแล้ว')
  }

  const user = await AuthRepository.findUserByEmail(reset_token.email)
  if (!user) {
    throw new Error('ไม่พบข้อมูลผู้ใช้')
  }

  const hashed_password = await bcrypt.hash(input_data.password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed_password },
  })

  // ลบ token ทิ้งทันทีหลังจากใช้งานเสร็จ
  await prisma.resetPasswordToken.deleteMany({ where: { email: user.email } })

  logger.info(`Password successfully reset for: ${user.email}`)
  return { success: true }
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
export async function LogoutService(user_id: string, refresh_token?: string) {
  if (refresh_token) {
    await prisma.refreshToken.updateMany({
      where: { userId: user_id, token: refresh_token },
      data: { revokedAt: new Date() },
    })
  } else {
    // Revoke all tokens for user
    await prisma.refreshToken.updateMany({
      where: { userId: user_id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  logger.info(`User logged out: ${user_id}`)
}

// Backward-compatible aliases used by route handlers.
export const loginService = LoginService
export const registerService = RegisterService
export const refreshTokenService = RefreshTokenService
export const forgotPasswordService = ForgotPasswordService
export const resetPasswordService = ResetPasswordService
export const logoutService = LogoutService
