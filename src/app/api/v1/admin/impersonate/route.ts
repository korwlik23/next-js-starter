import { NextRequest } from 'next/server'
import { ImpersonationService } from '@/modules/auth/impersonation.service'
import { verifyAccessToken } from '@/lib/jwt'
import { authConfig } from '@/config'
import { successResponse, unauthorized, badRequest } from '@/utils/api'
import { can } from '@/lib/permissions'
import { PERMISSIONS } from '@/constants'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function POST(req: NextRequest) {
  const locale = getLocaleFromRequest(req)

  try {
    const accessToken = req.cookies.get(authConfig.cookieName.accessToken)?.value
    if (!accessToken) return unauthorized(translate(locale, 'api.errors.unauthorized'))

    const adminPayload = await verifyAccessToken(accessToken)
    if (!adminPayload || !can(adminPayload, PERMISSIONS.ADMIN_IMPERSONATE)) {
      return unauthorized(translate(locale, 'api.messages.impersonationForbidden'))
    }

    const { target_user_id } = await req.json()
    if (!target_user_id)
      return badRequest(translate(locale, 'api.messages.impersonationTargetRequired'))

    const { tokens, user } = await ImpersonationService.StartImpersonation(
      adminPayload.sub,
      target_user_id
    )

    const response = successResponse(
      { user },
      translate(locale, 'api.messages.impersonationStarted')
    )

    response.cookies.set(authConfig.cookieName.accessToken, tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error: any) {
    return badRequest(error.message)
  }
}

export async function DELETE(req: NextRequest) {
  const locale = getLocaleFromRequest(req)

  try {
    const accessToken = req.cookies.get(authConfig.cookieName.accessToken)?.value
    if (!accessToken) return unauthorized(translate(locale, 'api.errors.unauthorized'))

    const currentPayload = await verifyAccessToken(accessToken)
    if (!currentPayload?.impersonatorId) {
      return badRequest(translate(locale, 'api.messages.notImpersonating'))
    }

    const { tokens, user } = await ImpersonationService.StopImpersonation(
      currentPayload.impersonatorId
    )

    const response = successResponse(
      { user },
      translate(locale, 'api.messages.impersonationStopped')
    )

    response.cookies.set(authConfig.cookieName.accessToken, tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error: any) {
    return badRequest(error.message)
  }
}
