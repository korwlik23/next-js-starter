import { NextRequest } from 'next/server'
import { successResponse, serverError, badRequest } from '@/utils/api'
import { forgotPasswordSchema } from '@/modules/auth/schema'
import { forgotPasswordService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// ขอลืมรหัสผ่าน -> ส่งอีเมล Reset Link
// ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('ข้อมูลไม่ถูกต้อง', parsed.error.flatten().fieldErrors)
    }

    await forgotPasswordService(parsed.data)

    // Security: คืนค่าสำเร็จเสมอ ไม่ว่า email จะมีอยู่ในระบบหรือไม่
    return successResponse(null, 'หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้คุณแล้ว')
  } catch (error) {
    logger.error('Forgot password API error', { error })
    return serverError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
  }
}
