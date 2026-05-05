import { successResponse, serverError } from '@/utils/api'
import { AnalyticsService } from '@/modules/analytics/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'

export const GET = withAuth(
  async (_req: Request) => {
    try {
      const data = await AnalyticsService.getDashboardAnalytics()
      return successResponse(data)
    } catch (error) {
      logger.error('[Analytics API] Error', { error })
      return serverError(error instanceof Error ? error.message : 'Internal error')
    }
  },
  { permission: 'dashboard.view' }
)
