import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { GetAllTranslations, UpsertTranslation } from './service'
import { upsertTranslationSchema, translationQuerySchema } from './schema'
import {
  successResponse,
  createdResponse,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// Translation Controller
// ────────────────────────────────────────

export class TranslationController {
  /**
   * ดึง translations ทั้งหมด (หรือตาม locale)
   */
  static async GetTranslations(req: NextRequest) {
    try {
      const user = await getAuthUser()
      if (!user) return unauthorized()

      const { searchParams } = new URL(req.url)
      const parsed = translationQuerySchema.safeParse({
        locale: searchParams.get('locale'),
        namespace: searchParams.get('namespace'),
      })

      const locale = parsed.success ? parsed.data.locale : undefined
      const translations = await GetAllTranslations(locale)
      return successResponse(translations)
    } catch (error) {
      logger.error('TranslationController.GetTranslations error', error)
      return serverError()
    }
  }

  /**
   * เพิ่มหรืออัปเดตคำแปล
   */
  static async UpsertTranslation(req: NextRequest) {
    try {
      const user = await getAuthUser()
      if (!user) return unauthorized()
      if (!can(user, PERMISSIONS.SETTINGS_UPDATE)) return forbidden()

      const body = await req.json()
      const parsed = upsertTranslationSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const translation = await UpsertTranslation(parsed.data)
      return createdResponse(translation, 'บันทึกคำแปลสำเร็จ')
    } catch (error) {
      logger.error('TranslationController.UpsertTranslation error', error)
      return serverError()
    }
  }
}
