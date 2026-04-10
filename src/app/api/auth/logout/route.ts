import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { logoutService } from '@/modules/auth/service'
import { clearAuthCookies } from '@/lib/auth'
import { getAuthUser } from '@/lib/auth'
import { successResponse, unauthorized } from '@/utils/api'
import { authConfig } from '@/config'

export async function POST(req: NextRequest) {
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
