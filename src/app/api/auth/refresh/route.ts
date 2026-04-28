import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { refreshTokenService } from '@/modules/auth/service'
import { authConfig } from '@/config'
import { successResponse, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'

function getSafeCallbackUrl(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') ?? '/dashboard'
  return callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/dashboard'
}

async function setAccessTokenCookie(accessToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(authConfig.cookieName.accessToken, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  })
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { accessToken } = await refreshTokenService(refreshToken)
    await setAccessTokenCookie(accessToken)

    return NextResponse.redirect(new URL(getSafeCallbackUrl(request), request.url))
  } catch (error) {
    logger.error('Refresh token redirect error', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    if (!refreshToken) return unauthorized('No refresh token')

    const { accessToken, user } = await refreshTokenService(refreshToken)

    // Set new access token cookie
    await setAccessTokenCookie(accessToken)

    return successResponse(
      { user: { id: user.sub, name: user.name, email: user.email, roles: user.roles } },
      'Token refreshed'
    )
  } catch (error) {
    logger.error('Refresh token error', error)
    return unauthorized('Invalid or expired refresh token')
  }
}
