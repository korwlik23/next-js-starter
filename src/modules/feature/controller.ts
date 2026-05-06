import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { GetAllFeatureFlags, UpdateFeatureFlag } from './service'
import { updateFeatureFlagSchema } from './schema'
import { successResponse, badRequest, unauthorized, forbidden, serverError } from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export class FeatureFlagController {
  static async GetAll(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const user = await getAuthUser()
      if (!user) return unauthorized(translate(locale, 'api.errors.unauthorized'))
      if (!can(user, PERMISSIONS.SETTINGS_VIEW))
        return forbidden(translate(locale, 'api.errors.forbidden'))

      const flags = await GetAllFeatureFlags()
      return successResponse(flags)
    } catch (error) {
      logger.error('FeatureFlagController.GetAll error', error)
      return serverError(translate(locale, 'api.messages.featureLoadError'))
    }
  }

  static async Update(req: NextRequest) {
    const locale = getLocaleFromRequest(req)

    try {
      const user = await getAuthUser()
      if (!user) return unauthorized(translate(locale, 'api.errors.unauthorized'))
      if (!can(user, PERMISSIONS.SETTINGS_UPDATE))
        return forbidden(translate(locale, 'api.errors.forbidden'))

      const body = await req.json()
      const parsed = updateFeatureFlagSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const flag = await UpdateFeatureFlag(parsed.data.key, parsed.data.enabled)
      return successResponse(
        flag,
        translate(locale, 'api.messages.featureUpdated', undefined, { key: parsed.data.key })
      )
    } catch (error) {
      logger.error('FeatureFlagController.Update error', error)
      return serverError(translate(locale, 'api.messages.featureUpdateError'))
    }
  }
}
