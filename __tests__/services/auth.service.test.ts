import { LoginService, RegisterService } from '@/modules/auth/service'
import { AuthRepository } from '@/modules/auth/repository'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// Mock dependencies
jest.mock('@/modules/auth/repository')
jest.mock('bcryptjs')
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn() },
  role: { findFirst: jest.fn() },
  loginAttempt: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  emailVerificationToken: {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userMfaSetting: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  mfaChallenge: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  mfaRecoveryCode: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((operations) => Promise.all(operations)),
}))
jest.mock('@/lib/jwt', () => ({
  signAuthTokens: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
}))
jest.mock('@/lib/inngest', () => ({
  inngest: {
    send: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/services/email.service', () => ({
  EmailService: {
    SendEmailVerificationEmail: jest.fn().mockResolvedValue(undefined),
    SendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    SendTeamInviteEmail: jest.fn().mockResolvedValue(undefined),
    SendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginService', () => {
    it('should throw error if user not found', async () => {
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.userMfaSetting.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        LoginService({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('AUTH_INVALID_CREDENTIALS')
      expect(prisma.loginAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            failureCount: 1,
          }),
        })
      )
    })

    it('should throw error if password does not match', async () => {
      ;(prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.userMfaSetting.findUnique as jest.Mock).mockResolvedValue(null)
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        LoginService({ email: 'test@example.com', password: 'wrong-password' })
      ).rejects.toThrow('AUTH_INVALID_CREDENTIALS')
    })

    it('should lock login when recent failures are over the threshold', async () => {
      ;(prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue({
        identifier: 'test@example.com:127.0.0.1',
        lockedUntil: new Date(Date.now() + 60_000),
        firstFailedAt: new Date(),
        failureCount: 5,
      })

      await expect(
        LoginService(
          { email: 'test@example.com', password: 'password' },
          { ipAddress: '127.0.0.1' }
        )
      ).rejects.toThrow('AUTH_LOGIN_LOCKED')
    })

    it('should return tokens and payload on successful login', async () => {
      ;(prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.userMfaSetting.findUnique as jest.Mock).mockResolvedValue(null)
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        tenantId: 'tenant-1',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        roles: [
          { tenantId: 'tenant-1', role: { name: 'admin', tenantId: 'tenant-1', permissions: [] } },
        ],
        permissions: [],
        tenantId: 'tenant-1',
      })

      const result = await LoginService({ email: 'test@example.com', password: 'correct-password' })

      expect(result.mfaRequired).not.toBe(true)
      if (result.mfaRequired) throw new Error('Expected token login result')
      expect(result.tokens).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.roles).toContain('admin')
      expect(prisma.refreshToken.create).toHaveBeenCalled()
      expect(prisma.loginAttempt.deleteMany).toHaveBeenCalled()
    })

    it('should return an MFA challenge when MFA is enabled', async () => {
      ;(prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null)
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(prisma.userMfaSetting.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        enabled: true,
      })
      ;(prisma.mfaChallenge.create as jest.Mock).mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() + 300_000),
      })

      const result = await LoginService({ email: 'test@example.com', password: 'correct-password' })

      expect(result).toMatchObject({ mfaRequired: true, challengeId: 'challenge-1' })
      expect(prisma.refreshToken.create).not.toHaveBeenCalled()
    })
  })

  describe('RegisterService', () => {
    it('should throw error if email already exists', async () => {
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing-user' })

      await expect(
        RegisterService({
          email: 'test@example.com',
          password: 'password',
          confirmPassword: 'password',
          name: 'Test User',
        })
      ).rejects.toThrow('AUTH_EMAIL_IN_USE')
    })

    it('should register successfully and return tokens', async () => {
      ;(AuthRepository.findUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.role.findFirst as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'member' })
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
        roles: [{ role: { name: 'member', tenantId: null, permissions: [] } }],
        permissions: [],
      })

      const result = await RegisterService({
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'New User',
      })

      expect(result.tokens).toBeDefined()
      expect(result.user.email).toBe('new@example.com')
      expect(prisma.user.create).toHaveBeenCalled()
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled()
    })
  })
})
