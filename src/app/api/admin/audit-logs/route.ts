import { withAuth } from '@/lib/authorize'
import { AuditService } from '@/modules/audit/service'
import { paginatedResponse, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'

// GET /api/admin/audit-logs
export const GET = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page') ?? 1)
      const limit = Number(searchParams.get('limit') ?? 20)
      const action = searchParams.get('action') ?? undefined
      const entity = searchParams.get('entity') ?? undefined
      const userId = searchParams.get('userId') ?? undefined

      const { data, meta } = await AuditService.getLogs({
        tenantId: user.tenantId, // กรองเฉพาะใน Tenant ของตัวเอง
        userId,
        action,
        entity,
        page,
        limit,
      })

      return paginatedResponse(data, meta)
    } catch (error) {
      logger.error('GET /api/admin/audit-logs error', error)
      return serverError('ไม่สามารถดึงข้อมูล Audit Logs ได้')
    }
  },
  { permission: 'audit.view' } // ใช้สิทธิ์ audit.view
)
