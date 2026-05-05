import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { PERMISSIONS } from '@/constants'
import { successResponse, unauthorized, forbidden, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'

// GET /api/permission — ดึงรายการ Permission ทั้งหมด (แยกกลุ่มตาม module)
export async function GET(_req: NextRequest) {
  try {
    const auth_user = await getAuthUser()
    if (!auth_user) return unauthorized()
    // ต้องมีสิทธิ์ role.read จึงจะเข้าถึงรายการ Permission ได้
    if (!can(auth_user, PERMISSIONS.ROLE_READ)) return forbidden()

    const permissions = await prisma.permission.findMany({
      select: { id: true, name: true, module: true, action: true, description: true },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    })

    // จัดกลุ่ม Permission ตาม module เพื่อให้ Frontend วาด Checkbox ได้ง่าย
    const grouped = permissions.reduce(
      (acc, perm) => {
        const module_key = perm.module
        if (!acc[module_key]) {
          acc[module_key] = []
        }
        acc[module_key].push(perm)
        return acc
      },
      {} as Record<string, typeof permissions>
    )

    return successResponse({ permissions, grouped })
  } catch (error) {
    logger.error('GET /api/permission error', error)
    return serverError()
  }
}
