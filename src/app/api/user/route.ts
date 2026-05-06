import type { NextRequest } from 'next/server'
import { withAuth } from '@/lib/authorize'
import { getUsersService, createUserService } from '@/modules/user/service'
import { createUserSchema } from '@/modules/user/schema'
import { createdResponse, paginatedResponse, badRequest, serverError } from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export const GET = withAuth(
  async (req: Request, { user }: any) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page') ?? 1)
      const limit = Number(searchParams.get('limit') ?? 10)
      const search = searchParams.get('search') ?? undefined

      const { users, total } = await getUsersService(user.tenantId, {
        page,
        limit,
        search,
      })

      return paginatedResponse(users, { total, page, limit })
    } catch (error) {
      logger.error('GET /api/user error', error)
      return serverError(translate(locale, 'api.messages.userLoadError'))
    }
  },
  { permission: PERMISSIONS.USER_READ }
)

export const POST = withAuth(
  async (req: Request, { user }: any) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const body = await req.json()
      const parsed = createUserSchema.safeParse(body)

      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const newUser = await createUserService({
        ...parsed.data,
        tenantId: user.tenantId,
      })

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: user.userId,
        tenantId: user.tenantId,
        action: 'USER_CREATE',
        entity: 'User',
        entityId: newUser.id,
        ipAddress,
        userAgent,
        metadata: {
          email: newUser.email,
          roleIds: parsed.data.roleIds,
        },
      })

      return createdResponse(newUser, translate(locale, 'api.messages.userCreated'))
    } catch (error) {
      logger.error('POST /api/user error', error)
      if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
        return badRequest(translate(locale, 'api.messages.emailExists'))
      }
      if (error instanceof Error && error.message === 'INVALID_ROLE_ASSIGNMENT') {
        return badRequest(translate(locale, 'api.messages.invalidRoleAssignment'))
      }
      return serverError(translate(locale, 'api.errors.server'))
    }
  },
  { permission: PERMISSIONS.USER_CREATE }
)
