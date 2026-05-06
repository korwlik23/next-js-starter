import { LoginService, RegisterService } from '@/modules/auth/service'
import { AuthRepository } from '@/modules/auth/repository'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// Mock dependencies
jest.mock('@/modules/auth/repository')
jest.mock('bcryptjs')
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  refreshToken: { create: jest.fn() },
  role: { findFirst: jest.fn() },
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

      await expect(
        LoginService({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('AUTH_INVALID_CREDENTIALS')
    })

    it('should throw error if password does not match', async () => {
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

    it('should return tokens and payload on successful login', async () => {
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

      expect(result.tokens).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.roles).toContain('admin')
      expect(prisma.refreshToken.create).toHaveBeenCalled()
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
    })
  })
})
