import { NextRequest } from 'next/server'
import { createRegisterSchema } from '@/modules/auth/schema'
import { registerService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { createdResponse, badRequest, conflict, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import { features } from '@/config'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getLocaleFromRequest, translate } from '@/i18n/server'
import type { SupportedLocale } from '@/i18n/config'

function authValidationMessages(locale: SupportedLocale) {
  return {
    invalidEmail: translate(locale, 'validation.invalidEmail'),
    nameMin: translate(locale, 'validation.nameMin'),
    passwordMin6: translate(locale, 'validation.passwordMin6'),
    passwordMin8: translate(locale, 'validation.passwordMin8'),
    passwordMismatch: translate(locale, 'validation.passwordMismatch'),
    tokenRequired: translate(locale, 'validation.tokenRequired'),
    refreshTokenRequired: translate(locale, 'validation.refreshTokenRequired'),
  }
}

export async function POST(req: NextRequest) {
  const locale = getLocaleFromRequest(req)
  const t = (key: string) => translate(locale, key)

  if (!features.registration) {
    return badRequest(t('auth.errors.registrationDisabled'))
  }

  try {
    const body = await req.json()
    const parsed = createRegisterSchema(authValidationMessages(locale)).safeParse(body)

    if (!parsed.success) {
      return badRequest(
        t('auth.errors.invalidInput'),
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { tokens, user } = await registerService(parsed.data)
    const { ipAddress, userAgent } = getRequestMetadata(req)

    AuditService.record({
      userId: user.sub,
      tenantId: user.tenantId,
      action: 'AUTH_REGISTER',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    })

    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return createdResponse(
      { user: { id: user.sub, name: user.name, email: user.email, roles: user.roles } },
      t('auth.successRegister')
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AUTH_SERVER_ERROR'

    if (code === 'AUTH_EMAIL_IN_USE') {
      logger.warn('Register failed', {
        reason: 'Email already exists',
      })
      return conflict(t('auth.errors.emailInUse'))
    }

    logger.error('Register error', error)
    return serverError(t('auth.errors.server'))
  }
}
