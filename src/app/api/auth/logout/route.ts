import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logoutService } from '@/modules/auth/service'
import { clearAuthCookies } from '@/lib/auth'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorized } from '@/utils/api'
import { authConfig } from '@/config'

export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(authConfig.cookieName.refreshToken)?.value

    await logoutService(user.sub, refreshToken)
    await clearAuthCookies()

    return successResponse(null, 'ออกจากระบบสำเร็จ')
  } catch {
    return successResponse(null, 'ออกจากระบบสำเร็จ')
  }
}

export async function GET(request: Request) {
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
