import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import {
  getUserByIdService,
  updateUserService,
  deleteUserService,
  updatePasswordService,
} from '@/modules/user/service'
import { updatePasswordSchema, updateUserSchema } from '@/modules/user/schema'
import {
  successResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/utils/api'
import { PERMISSIONS, ERROR_CODES } from '@/constants'
import { logger } from '@/lib/logger'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getLocaleFromRequest, translate } from '@/i18n/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  const locale = getLocaleFromRequest(req)

  try {
    const authUser = await getAuthUser()
    if (!authUser)
      return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_READ))
      return forbidden(translate(locale, 'api.messages.userReadForbidden'), ERROR_CODES.FORBIDDEN)
    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user)
      return notFound(translate(locale, 'api.messages.userNotFound'), ERROR_CODES.USER_NOT_FOUND)
    return successResponse(user)
  } catch (error) {
    logger.error('GET /api/user/[id]', error)
    return serverError(translate(locale, 'api.messages.userLoadError'), ERROR_CODES.INTERNAL_ERROR)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const locale = getLocaleFromRequest(req)

  try {
    const authUser = await getAuthUser()
    if (!authUser)
      return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_UPDATE))
      return forbidden(translate(locale, 'api.messages.userUpdateForbidden'), ERROR_CODES.FORBIDDEN)
    const body = await req.json()

    if ('currentPassword' in body || 'password' in body || 'newPassword' in body) {
      if (authUser.sub !== id)
        return forbidden(
          translate(locale, 'api.messages.userPasswordChangeForbidden'),
          ERROR_CODES.FORBIDDEN
        )

      const parsedPassword = updatePasswordSchema.safeParse({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword ?? body.password,
        confirmPassword: body.confirmPassword ?? body.password,
      })

      if (!parsedPassword.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          ERROR_CODES.VALIDATION_ERROR,
          parsedPassword.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      await updatePasswordService(id, parsedPassword.data)

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: authUser.sub,
        tenantId: authUser.tenantId,
        action: 'USER_PASSWORD_CHANGE',
        entity: 'User',
        entityId: id,
        ipAddress,
        userAgent,
        metadata: { targetUserId: id },
      })

      return successResponse(null, translate(locale, 'api.messages.passwordChanged'))
    }

    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(
        translate(locale, 'api.errors.validation'),
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user)
      return notFound(translate(locale, 'api.messages.userNotFound'), ERROR_CODES.USER_NOT_FOUND)

    const updated = await updateUserService(id, parsed.data, authUser.tenantId ?? null)

    const { ipAddress, userAgent } = getRequestMetadata(req)
    AuditService.record({
      userId: authUser.sub,
      tenantId: authUser.tenantId,
      action: 'USER_UPDATE',
      entity: 'User',
      entityId: id,
      ipAddress,
      userAgent,
      metadata: {
        updates: Object.keys(parsed.data),
        targetUserId: id,
      },
    })

    return successResponse(updated, translate(locale, 'api.messages.userUpdated'))
  } catch (error) {
    if (error instanceof Error && error.message === 'CURRENT_PASSWORD_INVALID') {
      return badRequest(
        translate(locale, 'api.messages.currentPasswordInvalid'),
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return notFound(translate(locale, 'api.messages.userNotFound'), ERROR_CODES.USER_NOT_FOUND)
    }
    if (error instanceof Error && error.message === 'INVALID_ROLE_ASSIGNMENT') {
      return badRequest(
        translate(locale, 'api.messages.invalidRoleAssignment'),
        ERROR_CODES.BAD_REQUEST
      )
    }
    logger.warn('PATCH /api/user/[id] failed', { error })
    return badRequest(translate(locale, 'api.errors.validation'), ERROR_CODES.BAD_REQUEST)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const locale = getLocaleFromRequest(req)

  try {
    const authUser = await getAuthUser()
    if (!authUser)
      return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_DELETE))
      return forbidden(translate(locale, 'api.messages.userDeleteForbidden'), ERROR_CODES.FORBIDDEN)
    if (authUser.sub === id)
      return badRequest(translate(locale, 'api.messages.cannotDeleteSelf'), ERROR_CODES.BAD_REQUEST)

    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user)
      return notFound(translate(locale, 'api.messages.userNotFound'), ERROR_CODES.USER_NOT_FOUND)

    await deleteUserService(id)

    const { ipAddress, userAgent } = getRequestMetadata(req)
    AuditService.record({
      userId: authUser.sub,
      tenantId: authUser.tenantId,
      action: 'USER_DELETE',
      entity: 'User',
      entityId: id,
      ipAddress,
      userAgent,
      metadata: { targetUserId: id },
    })

    return successResponse(null, translate(locale, 'api.messages.userDeleted'))
  } catch (error) {
    logger.error('DELETE /api/user/[id]', error)
    return serverError(
      translate(locale, 'api.messages.userDeleteError'),
      ERROR_CODES.INTERNAL_ERROR
    )
  }
}
