import { successResponse, serverError } from '@/utils/api'
import { AdminService } from '@/modules/admin/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import { PERMISSIONS } from '@/constants'

export const GET = withAuth(
  async () => {
    try {
      const data = await AdminService.getOpsSnapshot()
      return successResponse(data)
    } catch (error) {
      logger.error('[Admin Ops API] Error', { error })
      return serverError(error instanceof Error ? error.message : 'Internal error')
    }
  },
  { permission: PERMISSIONS.ADMIN_ACCESS }
)
