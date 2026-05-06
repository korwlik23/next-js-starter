import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { GetAllTranslations, UpsertTranslation } from './service'
import { upsertTranslationSchema, translationQuerySchema } from './schema'
import {
  successResponse,
  createdResponse,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export class TranslationController {
  static async GetTranslations(req: NextRequest) {
    const requestLocale = getLocaleFromRequest(req)

    try {
      const user = await getAuthUser()
      if (!user) return unauthorized(translate(requestLocale, 'api.errors.unauthorized'))

      const { searchParams } = new URL(req.url)
      const parsed = translationQuerySchema.safeParse({
        locale: searchParams.get('locale'),
        namespace: searchParams.get('namespace'),
      })

      const locale = parsed.success ? parsed.data.locale : undefined
      const translations = await GetAllTranslations(locale)
      return successResponse(translations)
    } catch (error) {
      logger.error('TranslationController.GetTranslations error', error)
      return serverError(translate(requestLocale, 'api.errors.server'))
    }
  }

  static async UpsertTranslation(req: NextRequest) {
    const requestLocale = getLocaleFromRequest(req)

    try {
      const user = await getAuthUser()
      if (!user) return unauthorized(translate(requestLocale, 'api.errors.unauthorized'))
      if (!can(user, PERMISSIONS.SETTINGS_UPDATE))
        return forbidden(translate(requestLocale, 'api.errors.forbidden'))

      const body = await req.json()
      const parsed = upsertTranslationSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          translate(requestLocale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const translation = await UpsertTranslation(parsed.data)
      return createdResponse(translation, translate(requestLocale, 'api.messages.translationSaved'))
    } catch (error) {
      logger.error('TranslationController.UpsertTranslation error', error)
      return serverError(translate(requestLocale, 'api.errors.server'))
    }
  }
}
