import prisma from '@/lib/prisma'

export const RoleRepository = {
  findById(id: string) {
    return prisma.role.findUnique({ where: { id } })
  },

  listByTenant(tenantId: string | null) {
    return prisma.role.findMany({
      where: { OR: [{ tenantId }, { isSystem: true }] },
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    })
  },
}
