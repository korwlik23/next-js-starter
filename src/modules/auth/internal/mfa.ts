import prisma from '@/lib/prisma'
import { signAuthTokens } from '@/lib/jwt'
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
import { appConfig } from '@/config'
import { MFA_CHALLENGE_EXPIRES_MS, REFRESH_TOKEN_EXPIRES_MS } from './constants'
import { BuildTokenPayload } from './principal'
import type { LoginContext } from './types'

/**
 * เปิด MFA challenge หลังจากรหัสผ่านถูกต้อง แต่ยังไม่ออก token จริง
 */
export async function createMfaChallenge(userId: string, context: LoginContext = {}) {
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

/**
 * เริ่มตั้งค่า TOTP — เก็บ secret แบบเข้ารหัสและยังไม่เปิดใช้จนกว่าจะยืนยัน
 */
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

/**
 * ยืนยันการตั้งค่า TOTP แล้วออกชุด recovery code ใหม่
 */
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

/**
 * ปิด MFA — ต้องยืนยันด้วยรหัสปัจจุบันก่อน และล้าง recovery code ทิ้ง
 */
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

/** ใช้ recovery code หนึ่งใบ ใบเดิมใช้ซ้ำไม่ได้ */
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

/**
 * ตรวจ MFA challenge แล้วออก token จริง
 * รับได้ทั้งรหัส TOTP และ recovery code; challenge ใช้ได้ครั้งเดียว
 */
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
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    }),
  ])

  return { tokens, user: payload }
}
