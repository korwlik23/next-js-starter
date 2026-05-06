import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { logoutService } from '@/modules/auth/service'
import { clearAuthCookies, getAuthUser } from '@/lib/auth'
import { successResponse, unauthorized } from '@/utils/api'
import { authConfig } from '@/config'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const message = translate(locale, 'auth.successLogout')

  try {
    const user = await getAuthUser()
    if (!user) return unauthorized(translate(locale, 'api.errors.unauthorized'))

    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    await logoutService(user.sub, refreshToken)
    await clearAuthCookies()

    return successResponse(null, message)
  } catch {
    return successResponse(null, message)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    if (user) {
      await logoutService(user.sub, refreshToken)
    }
  } catch {
    // Continue with cookie clearing and redirect even if token revocation fails.
  }

  await clearAuthCookies()

  return NextResponse.redirect(new URL('/login', request.url))
}
