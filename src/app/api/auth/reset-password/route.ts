import { NextRequest } from 'next/server'
import { successResponse, serverError, badRequest } from '@/utils/api'
import { resetPasswordSchema } from '@/modules/auth/schema'
import { resetPasswordService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// ยืนยัน Token แล้วตั้งค่า Password ใหม่
// ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('ข้อมูลไม่ถูกต้อง', parsed.error.flatten().fieldErrors)
    }

    await resetPasswordService(parsed.data)

    return successResponse(null, 'ตั้งรหัสผ่านใหม่สำเร็จ สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที')
  } catch (error) {
    logger.error('Reset password API error', { error })
    return serverError(
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    )
  }
}
