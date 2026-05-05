import prisma from '@/lib/prisma'

export const TenantRepository = {
  findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } })
  },

  findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } })
  },

  list(options: { skip?: number; take?: number; search?: string } = {}) {
    return prisma.tenant.findMany({
      where: options.search
        ? {
            OR: [{ name: { contains: options.search } }, { slug: { contains: options.search } }],
          }
        : undefined,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    })
  },
}
