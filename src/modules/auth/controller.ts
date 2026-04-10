import { NextRequest } from 'next/server'
import { loginSchema, registerSchema } from './schema'
import { loginService, registerService } from './service'
import { successResponse, badRequest, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'

export class AuthController {
  static async Login(req: NextRequest) {
    try {
      const body = await req.json()
      const parsed = loginSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง')
      }

      const result = await loginService(parsed.data)
      return successResponse(result, 'เข้าสู่ระบบสำเร็จ')
    } catch (error: any) {
      logger.error('AuthController.Login error', error)
      return unauthorized(error.message || 'รหัสผ่านหรืออีเมลไม่ถูกต้อง')
    }
  }

  static async Register(req: NextRequest) {
    try {
      const body = await req.json()
      const parsed = registerSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest('ข้อมูลสมัครสมาชิกไม่ถูกต้อง', parsed.error.flatten().fieldErrors as any)
      }

      const result = await registerService(parsed.data)
      return successResponse(result, 'สมัครสมาชิกสำเร็จ')
    } catch (error: any) {
      logger.error('AuthController.Register error', error)
      return badRequest(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
    }
  }
}
