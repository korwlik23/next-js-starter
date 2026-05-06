import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { withAuth } from '@/lib/authorize'
import { TranslationService, AVAILABLE_LANGUAGE_OPTIONS } from '@/modules/i18n/service'
import { badRequest, serverError, successResponse } from '@/utils/api'
import { getLocaleFromRequest, translate } from '@/i18n/server'
import { logger } from '@/lib/logger'

const settingsSchema = z.object({
  langMode: z.enum(['switch', 'multi']),
  defaultLocale: z.string().min(2).max(12),
  switchLocaleA: z.string().min(2).max(12),
  switchLocaleB: z.string().min(2).max(12),
})

const createLocaleSchema = z.object({
  code: z.string().min(2).max(12),
  name: z.string().min(1).max(80),
  nativeName: z.string().min(1).max(80),
  enabled: z.boolean().optional(),
  fallbackLocale: z.string().min(2).max(12).nullable().optional(),
})

async function getPayload() {
  const [runtimeConfig, allLocales] = await Promise.all([
    TranslationService.getRuntimeConfig(),
    TranslationService.getLocales(),
  ])

  return {
    settings: runtimeConfig.settings,
    locales: allLocales,
    availableLocales: runtimeConfig.availableLocales,
    languageOptions: AVAILABLE_LANGUAGE_OPTIONS,
  }
}

export const GET = withAuth(
  async () => {
    try {
      return successResponse(await getPayload())
    } catch (error) {
      logger.error('GET /api/admin/i18n error', error)
      return serverError('Unable to load i18n settings')
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)

export const PATCH = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const parsed = settingsSchema.safeParse(await req.json())
      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      await TranslationService.updateSettings(parsed.data)
      revalidateTag('i18n-settings', 'max')
      revalidateTag('translations', 'max')

      return successResponse(
        await getPayload(),
        translate(locale, 'api.messages.i18nSettingsSaved')
      )
    } catch (error) {
      logger.error('PATCH /api/admin/i18n error', error)
      return badRequest(translate(locale, 'api.messages.i18nSettingsInvalid'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)

export const POST = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const parsed = createLocaleSchema.safeParse(await req.json())
      if (!parsed.success) {
        return badRequest(
          translate(locale, 'api.errors.validation'),
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const createdLocale = await TranslationService.createLocale(parsed.data)
      revalidateTag('i18n-settings', 'max')
      revalidateTag('translations', 'max')

      return successResponse(
        { locale: createdLocale, ...(await getPayload()) },
        translate(locale, 'api.messages.localeCreated')
      )
    } catch (error) {
      logger.error('POST /api/admin/i18n error', error)
      return badRequest(translate(locale, 'api.messages.localeCreateFailed'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)

export const DELETE = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const { searchParams } = new URL(req.url)
      const code = searchParams.get('code')
      if (!code) {
        return badRequest(translate(locale, 'api.messages.localeCodeRequired'))
      }

      await TranslationService.deleteLocale(code)
      revalidateTag('i18n-settings', 'max')
      revalidateTag('translations', 'max')

      return successResponse(await getPayload(), translate(locale, 'api.messages.localeDeleted'))
    } catch (error) {
      logger.error('DELETE /api/admin/i18n error', error)
      return badRequest(translate(locale, 'api.messages.localeDeleteFailed'))
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)
