import { NextRequest, NextResponse } from 'next/server'
import { createLoginSchema } from '@/modules/auth/schema'
import { loginService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { successResponse, badRequest, errorResponse } from '@/utils/api'
import { logger } from '@/lib/logger'
import { HTTP_STATUS } from '@/constants'
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
  const isFormPost = req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
  let attemptedEmail: string | undefined

  try {
    const body = isFormPost
      ? Object.fromEntries((await req.formData()).entries())
      : await req.json()
    attemptedEmail = typeof body.email === 'string' ? body.email : undefined
    const parsed = createLoginSchema(authValidationMessages(locale)).safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>
      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url), 303)
      }
      return badRequest(t('auth.errors.invalidInput'), errors)
    }

    const { ipAddress, userAgent } = getRequestMetadata(req)
    const loginResult = await loginService(parsed.data, { ipAddress, userAgent })

    if (loginResult.mfaRequired) {
      AuditService.record({
        action: 'AUTH_LOGIN_MFA_REQUIRED',
        ipAddress,
        userAgent,
        metadata: { email: parsed.data.email },
      })

      return successResponse(
        {
          mfaRequired: true,
          challengeId: loginResult.challengeId,
          expiresAt: loginResult.expiresAt,
        },
        'Multi-factor authentication required'
      )
    }

    const { tokens, user } = loginResult

    AuditService.record({
      userId: user.sub,
      tenantId: user.tenantId,
      action: 'AUTH_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    })

    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    if (isFormPost) {
      return NextResponse.redirect(new URL('/dashboard', req.url), 303)
    }

    return successResponse(
      {
        user: {
          id: user.sub,
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          tenantId: user.tenantId,
        },
      },
      t('auth.successLogin')
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AUTH_SERVER_ERROR'

    if (code === 'AUTH_INVALID_CREDENTIALS') {
      logger.warn('Login failed', {
        email: attemptedEmail,
        reason: 'Invalid credentials',
      })

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        action: 'AUTH_LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: {
          email: attemptedEmail,
          reason: 'Invalid credentials',
        },
      })

      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url), 303)
      }
      return errorResponse(t('auth.errors.invalidCredentials'), HTTP_STATUS.UNAUTHORIZED)
    }

    if (code === 'AUTH_LOGIN_LOCKED') {
      logger.warn('Login locked', {
        email: attemptedEmail,
      })

      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        action: 'AUTH_LOGIN_LOCKED',
        ipAddress,
        userAgent,
        metadata: {
          email: attemptedEmail,
        },
      })

      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=locked', req.url), 303)
      }
      return errorResponse(
        'Too many failed login attempts. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'AUTH_LOGIN_LOCKED'
      )
    }

    if (code === 'AUTH_EMAIL_NOT_VERIFIED') {
      logger.warn('Login blocked because email is not verified', {
        email: attemptedEmail,
      })

      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=unverified', req.url), 303)
      }
      return errorResponse(
        'Please verify your email address before signing in.',
        HTTP_STATUS.FORBIDDEN,
        'AUTH_EMAIL_NOT_VERIFIED'
      )
    }

    logger.error('Login error', error)

    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=server', req.url), 303)
    }
    return errorResponse(t('auth.errors.server'), HTTP_STATUS.INTERNAL_ERROR)
  }
}
