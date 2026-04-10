import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { refreshTokenService } from '@/modules/auth/service'
import { authConfig } from '@/config'
import { successResponse, unauthorized, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    if (!refreshToken) return unauthorized('No refresh token')

    const { accessToken, user } = await refreshTokenService(refreshToken)

    // Set new access token cookie
    cookieStore.set(authConfig.cookieName.accessToken, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    })

    return successResponse(
      { user: { id: user.sub, name: user.name, email: user.email, roles: user.roles } },
      'Token refreshed'
    )
  } catch (error) {
    logger.error('Refresh token error', error)
    return unauthorized('Invalid or expired refresh token')
  }
}
