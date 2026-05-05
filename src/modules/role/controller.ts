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
import { createRoleSchema, updateRoleSchema } from './schema'
import { AuditService } from '../audit/service'
import { getRequestMetadata } from '@/utils/request'

export class RoleController {
  // ─────────────────────────────────────────
  // GET /api/role — ดึงรายการ Role ทั้งหมด
  // ─────────────────────────────────────────
  static async GetRoles(_req: NextRequest) {
    try {
      const auth_user = await getAuthUser()
      if (!auth_user) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
      if (!can(auth_user, PERMISSIONS.ROLE_READ))
        return forbidden('คุณไม่มีสิทธิ์อ่านข้อมูล Role', ERROR_CODES.FORBIDDEN)

      const roles = await getRolesService(auth_user.tenantId ?? null)
      return successResponse(roles)
    } catch (error) {
      logger.error('RoleController.GetRoles error', error)
      return serverError('ไม่สามารถดึงข้อมูล Role ได้', ERROR_CODES.INTERNAL_ERROR)
    }
  }

  // ─────────────────────────────────────────
  // POST /api/role — สร้าง Role ใหม่
  // ─────────────────────────────────────────
  static async CreateRole(req: NextRequest) {
    try {
      const auth_user = await getAuthUser()
      if (!auth_user) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
      if (!can(auth_user, PERMISSIONS.ROLE_CREATE))
        return forbidden('คุณไม่มีสิทธิ์สร้าง Role', ERROR_CODES.FORBIDDEN)

      const body = await req.json()
      const parsed = createRoleSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const role = await createRoleService(parsed.data, auth_user.tenantId ?? null)

      // Audit Log: Role Created
      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: auth_user.sub,
        tenantId: auth_user.tenantId,
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

      return createdResponse(role, `สร้าง Role "${role.name}" สำเร็จ`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      logger.error('RoleController.CreateRole error', error)
      if (message.includes('มีอยู่แล้ว')) return badRequest(message, ERROR_CODES.CONFLICT)
      return serverError('ไม่สามารถสร้าง Role ได้', ERROR_CODES.INTERNAL_ERROR)
    }
  }

  // ─────────────────────────────────────────
  // GET /api/role/[id] — ดึงข้อมูล Role เจาะจง
  // ─────────────────────────────────────────
  static async GetRole(req: NextRequest, role_id: string) {
    try {
      const auth_user = await getAuthUser()
      if (!auth_user) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
      if (!can(auth_user, PERMISSIONS.ROLE_READ))
        return forbidden('คุณไม่มีสิทธิ์อ่านข้อมูล Role', ERROR_CODES.FORBIDDEN)

      const role = await getRoleByIdService(role_id, auth_user.tenantId ?? null)
      if (!role) return notFound('ไม่พบ Role ที่ต้องการ', ERROR_CODES.ROLE_NOT_FOUND)
      return successResponse(role)
    } catch (error) {
      logger.error('RoleController.GetRole error', error)
      return serverError('ไม่สามารถดึงข้อมูล Role ได้', ERROR_CODES.INTERNAL_ERROR)
    }
  }

  // ─────────────────────────────────────────
  // PATCH /api/role/[id] — แก้ไข Role
  // ─────────────────────────────────────────
  static async UpdateRole(req: NextRequest, role_id: string) {
    try {
      const auth_user = await getAuthUser()
      if (!auth_user) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
      if (!can(auth_user, PERMISSIONS.ROLE_UPDATE))
        return forbidden('คุณไม่มีสิทธิ์แก้ไข Role', ERROR_CODES.FORBIDDEN)

      const body = await req.json()
      const parsed = updateRoleSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          ERROR_CODES.VALIDATION_ERROR,
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const role = await updateRoleService(role_id, parsed.data, auth_user.tenantId ?? null)

      // Audit Log: Role Updated
      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        userId: auth_user.sub,
        tenantId: auth_user.tenantId,
        action: 'ROLE_UPDATE',
        entity: 'Role',
        entityId: role_id,
        ipAddress,
        userAgent,
        metadata: {
          name: role.name,
          updates: Object.keys(parsed.data),
        },
      })

      return successResponse(role, `อัปเดต Role "${role.name}" สำเร็จ`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      logger.error('RoleController.UpdateRole error', error)
      if (message.includes('ไม่พบ')) return notFound(message, ERROR_CODES.ROLE_NOT_FOUND)
      if (message.includes('System Role'))
        return badRequest(message, ERROR_CODES.SYSTEM_ROLE_PROTECTED)
      return serverError('ไม่สามารถอัปเดต Role ได้', ERROR_CODES.INTERNAL_ERROR)
    }
  }

  // ─────────────────────────────────────────
  // DELETE /api/role/[id] — ลบ Role
  // ─────────────────────────────────────────
  static async DeleteRole(_req: NextRequest, role_id: string) {
    try {
      const auth_user = await getAuthUser()
      if (!auth_user) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
      if (!can(auth_user, PERMISSIONS.ROLE_DELETE))
        return forbidden('คุณไม่มีสิทธิ์ลบ Role', ERROR_CODES.FORBIDDEN)

      await deleteRoleService(role_id, auth_user.tenantId ?? null)

      // Audit Log: Role Deleted
      const { ipAddress, userAgent } = getRequestMetadata(_req)
      AuditService.record({
        userId: auth_user.sub,
        tenantId: auth_user.tenantId,
        action: 'ROLE_DELETE',
        entity: 'Role',
        entityId: role_id,
        ipAddress,
        userAgent,
        metadata: { roleId: role_id },
      })

      return successResponse(null, 'ลบ Role สำเร็จ')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      logger.error('RoleController.DeleteRole error', error)
      if (message.includes('ไม่พบ')) return notFound(message, ERROR_CODES.ROLE_NOT_FOUND)
      if (message.includes('System Role'))
        return badRequest(message, ERROR_CODES.SYSTEM_ROLE_PROTECTED)
      return serverError('ไม่สามารถลบ Role ได้', ERROR_CODES.INTERNAL_ERROR)
    }
  }
}
