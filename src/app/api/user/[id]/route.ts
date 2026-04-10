import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { getUserByIdService, updateUserService, deleteUserService } from '@/modules/user/service'
import { updateUserSchema } from '@/modules/user/schema'
import {
  successResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/user/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized()
    if (!can(authUser, PERMISSIONS.USER_READ)) return forbidden()

    const { id } = await params
    const user = await getUserByIdService(id)
    if (!user) return notFound('ไม่พบผู้ใช้งาน')
    return successResponse(user)
  } catch (error) {
    logger.error('GET /api/user/[id]', error)
    return serverError()
  }
}

// PATCH /api/user/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized()
    if (!can(authUser, PERMISSIONS.USER_UPDATE)) return forbidden()

    const { id } = await params
    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(
        'ข้อมูลไม่ถูกต้อง',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const user = await getUserByIdService(id)
    if (!user) return notFound('ไม่พบผู้ใช้งาน')

    const updated = await updateUserService(id, parsed.data)
    return successResponse(updated, 'อัปเดตผู้ใช้งานสำเร็จ')
  } catch (error) {
    logger.error('PATCH /api/user/[id]', error)
    return serverError()
  }
}

// DELETE /api/user/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return unauthorized()
    if (!can(authUser, PERMISSIONS.USER_DELETE)) return forbidden()

    const { id } = await params
    if (authUser.sub === id) return badRequest('ไม่สามารถลบตัวเองได้')

    const user = await getUserByIdService(id)
    if (!user) return notFound('ไม่พบผู้ใช้งาน')

    await deleteUserService(id)
    return successResponse(null, 'ลบผู้ใช้งานสำเร็จ')
  } catch (error) {
    logger.error('DELETE /api/user/[id]', error)
    return serverError()
  }
}
