import { withAuth } from '@/lib/authorize'
import { TranslationService } from '@/modules/i18n/service'
import { successResponse, badRequest, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import { revalidateTag } from 'next/cache'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'
import { getAuthUser } from '@/lib/auth'

// GET /api/admin/translations — รายการคำแปล
export const GET = withAuth(
  async (req: Request) => {
    try {
      const { searchParams } = new URL(req.url)
      const locale = searchParams.get('locale') || 'th'

      const data = await TranslationService.getByLocale(locale)
      return successResponse(data)
    } catch (error) {
      logger.error('GET /api/admin/translations error', error)
      return serverError()
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)

// POST /api/admin/translations — อัปเดต/เพิ่มคำแปล
export const POST = withAuth(
  async (req: Request) => {
    try {
      const body = await req.json()
      const { locale, namespace, key, value } = body

      if (!locale || !namespace || !key) {
        return badRequest('กรุณาระบุข้อมูลให้ครบถ้วน (locale, namespace, key)')
      }

      const result = await TranslationService.upsert({ locale, namespace, key, value })

      // Audit Log: Translation Updated
      const authUser = await getAuthUser()
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await AuditService.record({
        userId: authUser?.sub,
        tenantId: authUser?.tenantId,
        action: 'TRANSLATION_UPSERT',
        entity: 'Translation',
        entityId: `${locale}:${namespace}:${key}`,
        ipAddress,
        userAgent,
        metadata: { locale, namespace, key },
      })

      // ล้าง cache เพื่อให้คำแปลใหม่แสดงผลทันที
      revalidateTag('translations', 'max')

      return successResponse(result, 'บันทึกคำแปลสำเร็จ')
    } catch (error) {
      logger.error('POST /api/admin/translations error', error)
      return serverError()
    }
  },
  { permission: ['translation.manage', 'settings.update'] }
)
