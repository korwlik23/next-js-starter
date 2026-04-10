import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signAuthTokens, signAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import type { LoginInput, RegisterInput } from './schema'
import type { AuthTokens, TokenPayload } from '@/types'

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
async function getUserWithPermissions(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
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

function buildTokenPayload(user: Awaited<ReturnType<typeof getUserWithPermissions>>): TokenPayload {
  if (!user) throw new Error('User not found')

  // Collect role-based permissions
  const rolePermissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map((rp) => rp.permission.name)
  )
  // Direct override permissions
  const directPermissions = user.permissions.map((up) => up.permission.name)

  const permissions = [...new Set([...rolePermissions, ...directPermissions])]
  const roles = user.roles.map((ur) => ur.role.name)

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
export async function loginService(
  input: LoginInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (!user || !user.isActive || user.deletedAt) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password)
  if (!passwordMatch) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  const userWithPerms = await getUserWithPermissions(user.id)
  const payload = buildTokenPayload(userWithPerms)
  const tokens = await signAuthTokens(payload)

  // Store refresh token in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: {
      id: GenerateId(),
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  })

  logger.info(`User logged in: ${user.email}`)
  return { tokens, user: payload }
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export async function registerService(
  input: RegisterInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })
  if (existing) throw new Error('อีเมลนี้ถูกใช้งานแล้ว')

  const hashed = await bcrypt.hash(input.password, 12)

  // Get default 'member' role
  const memberRole = await prisma.role.findFirst({
    where: { name: 'member', tenantId: null },
  })

  const user = await prisma.user.create({
    data: {
      id: GenerateId(),
      name: input.name,
      email: input.email,
      password: hashed,
      ...(memberRole ? { roles: { create: { roleId: memberRole.id } } } : {}),
    },
  })

  const userWithPerms = await getUserWithPermissions(user.id)
  const payload = buildTokenPayload(userWithPerms)
  const tokens = await signAuthTokens(payload)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { id: GenerateId(), userId: user.id, token: tokens.refreshToken, expiresAt },
  })

  logger.info(`New user registered: ${user.email}`)
  return { tokens, user: payload }
}

// ─────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────
export async function refreshTokenService(
  refreshToken: string
): Promise<{ accessToken: string; user: TokenPayload }> {
  const userId = await verifyRefreshToken(refreshToken)
  if (!userId) throw new Error('Invalid refresh token')

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (!storedToken) throw new Error('Refresh token expired or revoked')

  const userWithPerms = await getUserWithPermissions(userId)
  const payload = buildTokenPayload(userWithPerms)
  const accessToken = await signAccessToken(payload)

  return { accessToken, user: payload }
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
export async function logoutService(userId: string, refreshToken?: string) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { userId, token: refreshToken },
      data: { revokedAt: new Date() },
    })
  } else {
    // Revoke all tokens for user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  logger.info(`User logged out: ${userId}`)
}
