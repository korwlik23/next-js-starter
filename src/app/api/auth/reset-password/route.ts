import { NextRequest } from 'next/server'
import { successResponse, serverError, badRequest } from '@/utils/api'
import { createResetPasswordSchema } from '@/modules/auth/schema'
import { resetPasswordService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = (key: string) => translate(locale, key)

  try {
    const body = await request.json()
    const parsed = createResetPasswordSchema({
      tokenRequired: t('validation.tokenRequired'),
      passwordMin8: t('validation.passwordMin8'),
      passwordMismatch: t('validation.passwordMismatch'),
    }).safeParse(body)

    if (!parsed.success) {
      return badRequest(t('auth.errors.invalidInput'), parsed.error.flatten().fieldErrors)
    }

    await resetPasswordService(parsed.data)

    return successResponse(null, t('auth.resetPasswordSuccess'))
  } catch (error) {
    logger.error('Reset password API error', { error })
    return serverError(error instanceof Error ? error.message : t('auth.errors.server'))
  }
}
