import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, badRequest, serverError, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'
import { CreateTenantSchema } from './schema'

export class TenantController {
  static async CreateTenant(req: NextRequest) {
    try {
      const authUser = await getAuthUser()
      if (!authUser) return unauthorized()

      const body = await req.json()
      const parsed = CreateTenantSchema.safeParse(body)
      if (!parsed.success) {
         return badRequest('ข้อมูลไม่ถูกต้อง')
      }

      // TODO: implementation for tenant creation pointing to service
      return successResponse(null, 'สร้างหน่วยงานสำเร็จ (Placeholder)')
    } catch (error: any) {
      logger.error('TenantController.CreateTenant error', error)
      return serverError()
    }
  }
}
