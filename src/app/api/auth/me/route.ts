import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { successResponse, unauthorized } from '@/utils/api'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      emailVerifiedAt: true,
      mfaSetting: {
        select: {
          enabled: true,
          confirmedAt: true,
        },
      },
    },
  })

  return successResponse({
    id: user.sub,
    name: user.name,
    email: user.email,
    emailVerifiedAt: dbUser?.emailVerifiedAt?.toISOString() ?? null,
    mfaEnabled: Boolean(dbUser?.mfaSetting?.enabled),
    roles: user.roles,
    permissions: user.permissions,
    tenantId: user.tenantId,
  })
}
