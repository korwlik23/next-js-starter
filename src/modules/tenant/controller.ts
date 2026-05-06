import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, badRequest, serverError, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'
import { CreateTenantSchema } from './schema'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export class TenantController {
  static async CreateTenant(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const authUser = await getAuthUser()
      if (!authUser) return unauthorized(translate(locale, 'api.errors.unauthorized'))

      const body = await req.json()
      const parsed = CreateTenantSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(translate(locale, 'api.errors.validation'))
      }

      return successResponse(null, translate(locale, 'api.messages.tenantCreatedPlaceholder'))
    } catch (error: any) {
      logger.error('TenantController.CreateTenant error', error)
      return serverError(translate(locale, 'api.errors.server'))
    }
  }
}
