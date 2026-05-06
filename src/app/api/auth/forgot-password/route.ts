import { NextRequest } from 'next/server'
import { successResponse, serverError, badRequest } from '@/utils/api'
import { createForgotPasswordSchema } from '@/modules/auth/schema'
import { forgotPasswordService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = (key: string) => translate(locale, key)

  try {
    const body = await request.json()
    const parsed = createForgotPasswordSchema({
      invalidEmail: t('validation.invalidEmail'),
    }).safeParse(body)

    if (!parsed.success) {
      return badRequest(t('auth.errors.invalidInput'), parsed.error.flatten().fieldErrors)
    }

    await forgotPasswordService(parsed.data)

    return successResponse(null, t('auth.forgotPasswordSent'))
  } catch (error) {
    logger.error('Forgot password API error', { error })
    return serverError(t('auth.errors.server'))
  }
}
