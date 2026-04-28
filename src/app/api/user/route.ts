import { withAuth } from '@/lib/authorize'
import { getUsersService, createUserService } from '@/modules/user/service'
import { createUserSchema } from '@/modules/user/schema'
import { createdResponse, paginatedResponse, badRequest, serverError } from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'

// GET /api/user — List users
export const GET = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page') ?? 1)
      const limit = Number(searchParams.get('limit') ?? 10)
      const search = searchParams.get('search') ?? undefined

      // ดึงข้อมูลผู้ใช้เฉพาะใน Tenant ของตัวเองเท่านั้น
      const { users, total } = await getUsersService(user.tenantId, {
        page,
        limit,
        search,
      })

      return paginatedResponse(users, { total, page, limit })
    } catch (error) {
      logger.error('GET /api/user error', error)
      return serverError()
    }
  },
  { permission: PERMISSIONS.USER_READ }
)

// POST /api/user — Create user
export const POST = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const body = await req.json()
      const parsed = createUserSchema.safeParse(body)

      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      // บังคับให้ user ที่ถูกสร้างใหม่ต้องอยู่ใน tenant เดียวกับคนสร้าง
      const newUser = await createUserService({
        ...parsed.data,
        tenantId: user.tenantId,
      })

      return createdResponse(newUser, 'สร้างผู้ใช้งานสำเร็จ')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      logger.error('POST /api/user error', error)
      if (message.includes('ถูกใช้งานแล้ว')) return badRequest(message)
      return serverError()
    }
  },
  { permission: PERMISSIONS.USER_CREATE }
)
