import prisma from '@/lib/prisma'

export const UserRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  listByTenant(
    tenantId: string | null,
    options: { skip?: number; take?: number; search?: string } = {}
  ) {
    const where = {
      tenantId,
      deletedAt: null,
      ...(options.search
        ? {
            OR: [{ name: { contains: options.search } }, { email: { contains: options.search } }],
          }
        : {}),
    }

    return prisma.user.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    })
  },
}
