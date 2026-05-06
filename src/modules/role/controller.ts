import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { PERMISSIONS, ERROR_CODES } from '@/constants'
import { logger } from '@/lib/logger'
import {
  successResponse,
  createdResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/utils/api'
import {
  getRolesService,
  getRoleByIdService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
} from './service'
import { createRoleSchemaFactory, updateRoleSchemaFactory } from './schema'
import { AuditService } from '../audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getLocaleFromRequest, translate } from '@/i18n/server'

function getRoleSchemaMessages(locale: ReturnType<typeof getLocaleFromRequest>) {
  return {
    nameMin: translate(locale, 'api.messages.roleNameMin'),
    nameMax: translate(locale, 'api.messages.roleNameMax'),
    namePattern: translate(locale, 'api.messages.roleNamePattern'),
  }
}

function roleErrorResponse(error: unknown, locale: ReturnType<typeof getLocaleFromRequest>) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'ROLE_EXISTS') {
    return badRequest(translate(locale, 'api.messages.roleExists'), ERROR_CODES.CONFLICT)
  }
  if (message === 'ROLE_NOT_FOUND') {
    return notFound(translate(locale, 'api.messages.roleNotFound'), ERROR_CODES.ROLE_NOT_FOUND)
  }
  if (message === 'SYSTEM_ROLE_UPDATE_FORBIDDEN') {
    return badRequest(
      translate(locale, 'api.messages.systemRoleUpdateForbidden'),
      ERROR_CODES.SYSTEM_ROLE_PROTECTED
    )
  }
  if (message === 'SYSTEM_ROLE_DELETE_FORBIDDEN') {
    return badRequest(
      translate(locale, 'api.messages.systemRoleDeleteForbidden'),
      ERROR_CODES.SYSTEM_ROLE_PROTECTED
    )
  }

  return null
}

export class RoleController {
  static async GetRoles(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser)
        return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
      if (!can(authUser, PERMISSIONS.ROLE_READ))
        return forbidden(translate(locale, 'api.messages.roleReadForbidden'), ERROR_CODES.FORBIDDEN)

      const roles = await getRolesService(authUser.tenantId ?? null)
      return successResponse(roles)
    } catch (error) {
      logger.error('RoleController.GetRoles error', error)
      return serverError(
        translate(locale, 'api.messages.rolesLoadError'),
        ERROR_CODES.INTERNAL_ERROR
      )
    }
  }

  static async CreateRole(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser)
        return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
      if (!can(authUser, PERMISSIONS.ROLE_CREATE))
        return forbidden(
          translate(locale, 'api.messages.roleCreateForbidden'),
          ERROR_CODES.FORBIDDEN
        )

      const body = await req.json()
      const parsed = createRoleSchemaFactory(getRoleSchemaMessages(locale)).safeParse(body)
      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const role = await createRoleService(parsed.data, authUser.tenantId ?? null)

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: authUser.sub,
        tenantId: authUser.tenantId,
        action: 'ROLE_CREATE',
        entity: 'Role',
        entityId: role.id,
        ipAddress,
        userAgent,
        metadata: {
          name: role.name,
          permissionsCount: parsed.data.permission_ids?.length || 0,
        },
      })

      return createdResponse(
        role,
        translate(locale, 'api.messages.roleCreated', undefined, { name: role.name })
      )
    } catch (error) {
      logger.error('RoleController.CreateRole error', error)
      const localizedError = roleErrorResponse(error, locale)
      if (localizedError) return localizedError
      return serverError(
        translate(locale, 'api.messages.roleCreateError'),
        ERROR_CODES.INTERNAL_ERROR
      )
    }
  }

  static async GetRole(req: NextRequest, roleId: string) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser)
        return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
      if (!can(authUser, PERMISSIONS.ROLE_READ))
        return forbidden(translate(locale, 'api.messages.roleReadForbidden'), ERROR_CODES.FORBIDDEN)

      const role = await getRoleByIdService(roleId, authUser.tenantId ?? null)
      if (!role)
        return notFound(translate(locale, 'api.messages.roleNotFound'), ERROR_CODES.ROLE_NOT_FOUND)
      return successResponse(role)
    } catch (error) {
      logger.error('RoleController.GetRole error', error)
      return serverError(
        translate(locale, 'api.messages.rolesLoadError'),
        ERROR_CODES.INTERNAL_ERROR
      )
    }
  }

  static async UpdateRole(req: NextRequest, roleId: string) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser)
        return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
      if (!can(authUser, PERMISSIONS.ROLE_UPDATE))
        return forbidden(
          translate(locale, 'api.messages.roleUpdateForbidden'),
          ERROR_CODES.FORBIDDEN
        )

      const body = await req.json()
      const parsed = updateRoleSchemaFactory(getRoleSchemaMessages(locale)).safeParse(body)
      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const role = await updateRoleService(roleId, parsed.data, authUser.tenantId ?? null)

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: authUser.sub,
        tenantId: authUser.tenantId,
        action: 'ROLE_UPDATE',
        entity: 'Role',
        entityId: roleId,
        ipAddress,
        userAgent,
        metadata: {
          name: role.name,
          updates: Object.keys(parsed.data),
        },
      })

      return successResponse(
        role,
        translate(locale, 'api.messages.roleUpdated', undefined, { name: role.name })
      )
    } catch (error) {
      logger.error('RoleController.UpdateRole error', error)
      const localizedError = roleErrorResponse(error, locale)
      if (localizedError) return localizedError
      return serverError(
        translate(locale, 'api.messages.roleUpdateError'),
        ERROR_CODES.INTERNAL_ERROR
      )
    }
  }

  static async DeleteRole(req: NextRequest, roleId: string) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser)
        return unauthorized(translate(locale, 'api.errors.unauthorized'), ERROR_CODES.UNAUTHORIZED)
      if (!can(authUser, PERMISSIONS.ROLE_DELETE))
        return forbidden(
          translate(locale, 'api.messages.roleDeleteForbidden'),
          ERROR_CODES.FORBIDDEN
        )

      await deleteRoleService(roleId, authUser.tenantId ?? null)

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: authUser.sub,
        tenantId: authUser.tenantId,
        action: 'ROLE_DELETE',
        entity: 'Role',
        entityId: roleId,
        ipAddress,
        userAgent,
        metadata: { roleId },
      })

      return successResponse(null, translate(locale, 'api.messages.roleDeleted'))
    } catch (error) {
      logger.error('RoleController.DeleteRole error', error)
      const localizedError = roleErrorResponse(error, locale)
      if (localizedError) return localizedError
      return serverError(
        translate(locale, 'api.messages.roleDeleteError'),
        ERROR_CODES.INTERNAL_ERROR
      )
    }
  }
}
