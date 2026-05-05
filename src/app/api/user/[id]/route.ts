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

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/user/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_READ))
      return forbidden('คุณไม่มีสิทธิ์อ่านข้อมูลผู้ใช้อื่น', ERROR_CODES.FORBIDDEN)
    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user) return notFound('ไม่พบผู้ใช้งาน', ERROR_CODES.USER_NOT_FOUND)
    return successResponse(user)
  } catch (error) {
    logger.error('GET /api/user/[id]', error)
    return serverError('เกิดข้อผิดพลาดในการดึงข้อมูล', ERROR_CODES.INTERNAL_ERROR)
  }
}

// PATCH /api/user/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_UPDATE))
      return forbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้อื่น', ERROR_CODES.FORBIDDEN)
    const body = await req.json()

    if ('currentPassword' in body || 'password' in body || 'newPassword' in body) {
      if (authUser.sub !== id)
        return forbidden('คุณไม่มีสิทธิ์เปลี่ยนรหัสผ่านผู้อื่น', ERROR_CODES.FORBIDDEN)

      const parsedPassword = updatePasswordSchema.safeParse({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword ?? body.password,
        confirmPassword: body.confirmPassword ?? body.password,
      })

      if (!parsedPassword.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          ERROR_CODES.VALIDATION_ERROR,
          parsedPassword.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      await updatePasswordService(id, parsedPassword.data)
      return successResponse(null, 'เปลี่ยนรหัสผ่านสำเร็จ')
    }

    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(
        'ข้อมูลไม่ถูกต้อง',
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user) return notFound('ไม่พบผู้ใช้งาน', ERROR_CODES.USER_NOT_FOUND)

    const updated = await updateUserService(id, parsed.data)
    return successResponse(updated, 'อัปเดตผู้ใช้งานสำเร็จ')
  } catch (error) {
    const message = error instanceof Error ? error.message : null
    const is_known_error =
      message &&
      (message.includes('รหัสผ่านปัจจุบันไม่ถูกต้อง') ||
        message.includes('ไม่พบผู้ใช้งาน') ||
        message.includes('ไม่ตรงกัน'))

    if (is_known_error) {
      const code = message.includes('รหัสผ่านปัจจุบันไม่ถูกต้อง')
        ? ERROR_CODES.INVALID_CREDENTIALS
        : ERROR_CODES.BAD_REQUEST
      logger.warn('PATCH /api/user/[id] validation error', { message })
      return badRequest(message!, code)
    }

    logger.error('PATCH /api/user/[id]', error)
    return serverError('เกิดข้อผิดพลาดในการอัปเดต', ERROR_CODES.INTERNAL_ERROR)
  }
}

// DELETE /api/user/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized('กรุณาเข้าสู่ระบบ', ERROR_CODES.UNAUTHORIZED)
    const { id } = await params
    if (authUser.sub !== id && !can(authUser, PERMISSIONS.USER_DELETE))
      return forbidden('คุณไม่มีสิทธิ์ลบผู้ใช้อื่น', ERROR_CODES.FORBIDDEN)
    if (authUser.sub === id) return badRequest('ไม่สามารถลบตัวเองได้', ERROR_CODES.BAD_REQUEST)

    const user = await getUserByIdService(id, authUser.tenantId ?? null)
    if (!user) return notFound('ไม่พบผู้ใช้งาน', ERROR_CODES.USER_NOT_FOUND)

    await deleteUserService(id)
    return successResponse(null, 'ลบผู้ใช้งานสำเร็จ')
  } catch (error) {
    logger.error('DELETE /api/user/[id]', error)
    return serverError('เกิดข้อผิดพลาดในการลบ', ERROR_CODES.INTERNAL_ERROR)
  }
}
