import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { withAuth } from '@/lib/authorize'
import { TranslationService } from '@/modules/i18n/service'
import { successResponse, badRequest, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getAuthUser } from '@/lib/auth'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export const GET = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const { searchParams } = new URL(req.url)
      const targetLocale = searchParams.get('locale') || 'th'

      const data = await TranslationService.getByLocale(targetLocale)
      return successResponse(data)
    } catch (error) {
      logger.error('GET /api/admin/translations error', error)
      return serverError(translate(locale, 'api.errors.server'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)

export const POST = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const body = await req.json()
      const { locale: targetLocale, namespace, key, value } = body

      if (!targetLocale || !namespace || !key) {
        return badRequest(translate(locale, 'api.messages.translationRequired'))
      }

      const result = await TranslationService.upsert({
        locale: targetLocale,
        namespace,
        key,
        value,
      })

      const authUser = await getAuthUser()
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await AuditService.record({
        userId: authUser?.sub,
        tenantId: authUser?.tenantId,
        action: 'TRANSLATION_UPSERT',
        entity: 'Translation',
        entityId: `${targetLocale}:${namespace}:${key}`,
        ipAddress,
        userAgent,
        metadata: { locale: targetLocale, namespace, key },
      })

      revalidateTag('translations', 'max')

      return successResponse(result, translate(locale, 'api.messages.translationSaved'))
    } catch (error) {
      logger.error('POST /api/admin/translations error', error)
      return serverError(translate(locale, 'api.errors.server'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)
