import { successResponse, serverError } from '@/utils/api'
import { AdminService } from '@/modules/admin/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import { PERMISSIONS } from '@/constants'

export const GET = withAuth(
  async (_req: Request) => {
    try {
      const data = await AdminService.getAdminStats()
      return successResponse(data)
    } catch (error) {
      logger.error('[Admin Stats API] Error', { error })
      return serverError(error instanceof Error ? error.message : 'Internal error')
    }
  },
  { permission: PERMISSIONS.ADMIN_ACCESS }
)
