import { NextRequest } from 'next/server'
import { registerSchema } from '@/modules/auth/schema'
import { registerService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { createdResponse, badRequest, conflict, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import { features } from '@/config'

export async function POST(req: NextRequest) {
  if (!features.registration) {
    return badRequest('Registration is currently disabled')
  }

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(
        'ข้อมูลไม่ถูกต้อง',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { tokens, user } = await registerService(parsed.data)
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return createdResponse(
      { user: { id: user.sub, name: user.name, email: user.email, roles: user.roles } },
      'สร้างบัญชีสำเร็จ'
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    logger.error('Register error', error)
    if (message.includes('ถูกใช้งานแล้ว')) return conflict(message)
    return serverError()
  }
}
