import type { NextRequest } from 'next/server'
import { withAuth } from '@/lib/authorize'
import { AuditService } from '@/modules/audit/service'
import { paginatedResponse, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export const GET = withAuth(
  async (req: Request, { user }: any) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page') ?? 1)
      const limit = Number(searchParams.get('limit') ?? 20)
      const action = searchParams.get('action') ?? undefined
      const entity = searchParams.get('entity') ?? undefined
      const userId = searchParams.get('userId') ?? undefined

      const { data, meta } = await AuditService.getLogs({
        tenantId: user.tenantId,
        userId,
        action,
        entity,
        page,
        limit,
      })

      return paginatedResponse(data, meta)
    } catch (error) {
      logger.error('GET /api/admin/audit-logs error', error)
      return serverError(translate(locale, 'api.messages.auditLogsLoadError'))
    }
  },
  { permission: 'audit.view' }
)
