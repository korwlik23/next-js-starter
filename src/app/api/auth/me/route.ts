import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorized } from '@/utils/api'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  return successResponse({
    id: user.sub,
    name: user.name,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    tenantId: user.tenantId,
  })
}
