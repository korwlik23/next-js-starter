import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import prisma from '@/lib/prisma'
import { signAuthTokens, signAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { inngest } from '@/lib/inngest'
import { GenerateId } from '@/lib/ulid'
import {
  buildTotpUri,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from '@/lib/totp'
import { appConfig, authConfig } from '@/config'
import type { LoginInput, RegisterInput } from './schema'
import type { AuthTokens, TokenPayload } from '@/types'
import { EmailService } from '@/services/email.service'
import type { ForgotPasswordInput, ResetPasswordInput } from './schema'
import { AuthRepository } from './repository'

const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000
const MAX_LOGIN_FAILURES = 5
const EMAIL_VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000
const MFA_CHALLENGE_EXPIRES_MS = 5 * 60 * 1000

interface LoginContext {
  ipAddress?: string | null
  userAgent?: string | null
}

type LoginServiceResult =
  | { tokens: AuthTokens; user: TokenPayload; mfaRequired?: false }
  | { mfaRequired: true; challengeId: string; expiresAt: string }

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function createLoginIdentifier(email: string, ipAddress?: string | null) {
  return `${normalizeEmail(email)}:${ipAddress || 'unknown'}`
}

function createVerificationToken() {
  return `${GenerateId()}${GenerateId()}`
}

async function assertLoginNotLocked(email: string, ipAddress?: string | null) {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { identifier: createLoginIdentifier(email, ipAddress) },
  })

  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    throw new Error('AUTH_LOGIN_LOCKED')
  }
}

async function recordLoginFailure(email: string, ipAddress?: string | null) {
  const now = new Date()
  const identifier = createLoginIdentifier(email, ipAddress)
  const existing = await prisma.loginAttempt.findUnique({ where: { identifier } })
  const shouldResetWindow =
    !existing || now.getTime() - existing.firstFailedAt.getTime() > LOGIN_LOCK_WINDOW_MS
  const failureCount = shouldResetWindow ? 1 : existing.failureCount + 1
  const lockedUntil =
    failureCount >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) : null

  if (!existing) {
    await prisma.loginAttempt.create({
      data: {
        id: GenerateId(),
        identifier,
        email: normalizeEmail(email),
        ipAddress: ipAddress || null,
        failureCount,
        firstFailedAt: now,
        lockedUntil,
      },
    })
    return
  }

  await prisma.loginAttempt.update({
    where: { identifier },
    data: {
      email: normalizeEmail(email),
      ipAddress: ipAddress || null,
      failureCount,
      firstFailedAt: shouldResetWindow ? now : existing.firstFailedAt,
      lockedUntil,
    },
  })
}

async function clearLoginFailures(email: string, ipAddress?: string | null) {
  try {
    await prisma.loginAttempt.deleteMany({
      where: { identifier: createLoginIdentifier(email, ipAddress) },
    })
  } catch (error) {
    logger.warn('Failed to clear login attempts', { error })
  }
}

export async function CreateEmailVerificationToken(user: { id: string; email: string }) {
  const token = createVerificationToken()
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS)

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId: user.id,
      consumedAt: null,
    },
  })

  await prisma.emailVerificationToken.create({
    data: {
      id: GenerateId(),
      userId: user.id,
      email: normalizeEmail(user.email),
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  return token
}

export async function VerifyEmailService(token: string) {
  const tokenHash = hashToken(token)
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  })

  if (
    !verificationToken ||
    verificationToken.consumedAt ||
    verificationToken.expiresAt < new Date()
  ) {
    throw new Error('AUTH_EMAIL_VERIFICATION_INVALID')
  }

  const verifiedAt = new Date()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: verifiedAt },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { consumedAt: verifiedAt },
    }),
  ])

  return { success: true, email: verificationToken.email }
}

async function createMfaChallenge(userId: string, context: LoginContext = {}) {
  const expiresAt = new Date(Date.now() + MFA_CHALLENGE_EXPIRES_MS)

  const challenge = await prisma.mfaChallenge.create({
    data: {
      id: GenerateId(),
      userId,
      expiresAt,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
    },
  })

  return {
    mfaRequired: true as const,
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt.toISOString(),
  }
}

export async function StartMfaSetupService(userId: string, email: string) {
  const secret = generateTotpSecret()
  const encrypted = encryptSecret(secret)

  await prisma.userMfaSetting.upsert({
    where: { userId },
    create: {
      id: GenerateId(),
      userId,
      secretEncrypted: encrypted,
      enabled: false,
    },
    update: {
      secretEncrypted: encrypted,
      enabled: false,
      confirmedAt: null,
    },
  })

  return {
    secret,
    otpauthUrl: buildTotpUri({
      issuer: appConfig.name,
      accountName: email,
      secret,
    }),
  }
}

export async function ConfirmMfaSetupService(userId: string, code: string) {
  const setting = await prisma.userMfaSetting.findUnique({ where: { userId } })
  if (!setting) throw new Error('MFA_SETUP_NOT_STARTED')

  const secret = decryptSecret(setting.secretEncrypted)
  if (!verifyTotpCode(secret, code)) {
    throw new Error('MFA_INVALID_CODE')
  }

  const recoveryCodes = generateRecoveryCodes()
  const now = new Date()

  await prisma.$transaction([
    prisma.userMfaSetting.update({
      where: { userId },
      data: {
        enabled: true,
        confirmedAt: now,
      },
    }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    prisma.mfaRecoveryCode.createMany({
      data: recoveryCodes.map((recoveryCode) => ({
        id: GenerateId(),
        userId,
        codeHash: hashRecoveryCode(recoveryCode),
      })),
    }),
  ])

  return { enabled: true, recoveryCodes }
}

export async function DisableMfaService(userId: string, code: string) {
  const setting = await prisma.userMfaSetting.findUnique({ where: { userId } })
  if (!setting?.enabled) throw new Error('MFA_NOT_ENABLED')

  const secret = decryptSecret(setting.secretEncrypted)
  if (!verifyTotpCode(secret, code)) {
    throw new Error('MFA_INVALID_CODE')
  }

  await prisma.$transaction([
    prisma.userMfaSetting.update({
      where: { userId },
      data: {
        enabled: false,
        confirmedAt: null,
      },
    }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
  ])

  return { enabled: false }
}

async function consumeRecoveryCode(userId: string, code: string) {
  const codeHash = hashRecoveryCode(code)
  const recoveryCode = await prisma.mfaRecoveryCode.findUnique({ where: { codeHash } })

  if (!recoveryCode || recoveryCode.userId !== userId || recoveryCode.usedAt) {
    return false
  }

  await prisma.mfaRecoveryCode.update({
    where: { id: recoveryCode.id },
    data: { usedAt: new Date() },
  })

  return true
}

export async function VerifyMfaChallengeService(challengeId: string, code: string) {
  const challenge = await prisma.mfaChallenge.findUnique({
    where: { id: challengeId },
    include: {
      user: {
        include: {
          mfaSetting: true,
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
      },
    },
  })

  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    throw new Error('MFA_CHALLENGE_INVALID')
  }

  const setting = challenge.user.mfaSetting
  if (!setting?.enabled) throw new Error('MFA_NOT_ENABLED')

  const secret = decryptSecret(setting.secretEncrypted)
  const codeValid =
    verifyTotpCode(secret, code) || (await consumeRecoveryCode(challenge.userId, code))

  if (!codeValid) throw new Error('MFA_INVALID_CODE')

  const payload = BuildTokenPayload(challenge.user)
  const tokens = await signAuthTokens(payload)
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        id: GenerateId(),
        userId: challenge.userId,
        token: tokens.refreshToken,
        expiresAt: expires_at,
      },
    }),
  ])

  return { tokens, user: payload }
}

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

  await clearLoginFailures(email, context.ipAddress)
  logger.info(`User logged in: ${user.email}`)
  return { tokens, user: payload }
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export async function RegisterService(
  input_data: RegisterInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const email = normalizeEmail(input_data.email)
  const existing = await AuthRepository.findUserByEmail(email)
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
      email,
      password: hashed_password,
      ...(member_role ? { roles: { create: { roleId: member_role.id } } } : {}),
    },
  })

  const verificationToken = await CreateEmailVerificationToken({ id: user.id, email: user.email })
  await EmailService.SendEmailVerificationEmail(user.email, verificationToken).catch((error) => {
    logger.warn('Failed to send email verification email', { error, userId: user.id })
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
export const verifyEmailService = VerifyEmailService
export const startMfaSetupService = StartMfaSetupService
export const confirmMfaSetupService = ConfirmMfaSetupService
export const disableMfaService = DisableMfaService
export const verifyMfaChallengeService = VerifyMfaChallengeService
