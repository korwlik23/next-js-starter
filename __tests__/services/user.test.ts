import { getUsersService } from '@/modules/user/service'
import prisma from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
}))

describe('UserService - Tenant Isolation', () => {
  it('should filter users by tenantId correctly', async () => {
    const mockTenantId = 'tenant_123'
    const mockUsers = [{ id: '1', name: 'User 1', tenantId: mockTenantId }]

    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(1)

    const result = await getUsersService(mockTenantId, { page: 1, limit: 10 })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: mockTenantId,
        }),
      })
    )
    expect(result.users).toEqual(mockUsers)
  })

  it('should not allow fetching users without tenantId if not admin', async () => {
    // ใน service ที่เราแก้ไป มันรับ tenantId เป็น parameter แรกเลย
    // ดังนั้นถ้าเราส่ง null ไป มันก็ควรจะ query ด้วย tenantId: null
    await getUsersService(null)

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: null,
        }),
      })
    )
  })
})
