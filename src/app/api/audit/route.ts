import { withAuth } from '@/lib/authorize'
import { AuditController } from '@/modules/audit/controller'
import { PERMISSIONS } from '@/constants'

export const GET = withAuth(
  async (request: Request, ctx: any) => {
    return AuditController.GetAuditLogs(request, ctx)
  },
  { permission: PERMISSIONS.AUDIT_VIEW }
)
