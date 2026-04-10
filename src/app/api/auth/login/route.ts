import { NextRequest } from 'next/server'
import { loginSchema } from '@/modules/auth/schema'
import { loginService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { successResponse, badRequest, errorResponse } from '@/utils/api'
import { logger } from '@/lib/logger'
import { HTTP_STATUS } from '@/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>
      return badRequest('ข้อมูลไม่ถูกต้อง', errors)
    }

    const { tokens, user } = await loginService(parsed.data)

    // Set httpOnly cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return successResponse(
      { user: { id: user.sub, name: user.name, email: user.email, roles: user.roles } },
      'เข้าสู่ระบบสำเร็จ'
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    logger.error('Login error', error)

    if (message.includes('ไม่ถูกต้อง')) {
      return errorResponse(message, HTTP_STATUS.UNAUTHORIZED)
    }
    return errorResponse('เกิดข้อผิดพลาดภายในระบบ', HTTP_STATUS.INTERNAL_ERROR)
  }
}
