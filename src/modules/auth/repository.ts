import prisma from '@/lib/prisma'

export const AuthRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  findRefreshToken(token: string, userId: string) {
    return prisma.refreshToken.findFirst({
      where: {
        token,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
  },
}
