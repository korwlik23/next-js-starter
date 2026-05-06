import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { withAuth } from '@/lib/authorize'
import { getAuthUser } from '@/lib/auth'
import { TranslationService } from '@/modules/i18n/service'
import { badRequest, serverError, successResponse } from '@/utils/api'
import { getLocaleFromRequest, translate } from '@/i18n/server'
import { logger } from '@/lib/logger'

const autoTranslateSchema = z.object({
  locale: z.string().min(2).max(12),
})

export const POST = withAuth(
  async (req: Request) => {
    const requestLocale = getLocaleFromRequest(req as NextRequest)

    try {
      const parsed = autoTranslateSchema.safeParse(await req.json())
      if (!parsed.success) {
        return badRequest(
          translate(requestLocale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      if (!process.env.AUTO_TRANSLATE_ENDPOINT) {
        return badRequest(translate(requestLocale, 'api.messages.autoTranslateNotConfigured'))
      }

      const authUser = await getAuthUser()
      const result = await TranslationService.autoTranslateMissing(
        parsed.data.locale,
        authUser?.sub
      )
      revalidateTag('translations', 'max')

      return successResponse(result, translate(requestLocale, 'api.messages.autoTranslateQueued'))
    } catch (error) {
      logger.error('POST /api/admin/i18n/auto-translate error', error)
      return serverError(translate(requestLocale, 'api.messages.autoTranslateFailed'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)
