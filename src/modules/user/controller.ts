import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { getUsersService, createUserService } from './service'
import { createUserSchema } from './schema'
import {
  createdResponse,
  paginatedResponse,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'

export class UserController {
  static async GetUsers(req: NextRequest) {
    try {
      const user = await getAuthUser()
      if (!user) return unauthorized()
      if (!can(user, PERMISSIONS.USER_READ)) return forbidden()

      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page') ?? 1)
      const limit = Number(searchParams.get('limit') ?? 10)
      const search = searchParams.get('search') ?? undefined

      const { users, total } = await getUsersService({ page, limit, search })
      return paginatedResponse(users, { total, page, limit })
    } catch (error) {
      logger.error('UserController.GetUsers error', error)
      return serverError()
    }
  }

  static async CreateUser(req: NextRequest) {
    try {
      const authUser = await getAuthUser()
      if (!authUser) return unauthorized()
      if (!can(authUser, PERMISSIONS.USER_CREATE)) return forbidden()

      const body = await req.json()
      const parsed = createUserSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const newUser = await createUserService(parsed.data)
      return createdResponse(newUser, 'สร้างผู้ใช้งานสำเร็จ')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      logger.error('UserController.CreateUser error', error)
      if (message.includes('ถูกใช้งานแล้ว')) return badRequest(message)
      return serverError()
    }
  }
}
