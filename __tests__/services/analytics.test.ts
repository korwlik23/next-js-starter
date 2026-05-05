import { AnalyticsService } from '@/modules/analytics/service'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  auditLog: { count: jest.fn() },
  user: { count: jest.fn() },
  refreshToken: { count: jest.fn() },
  $queryRawUnsafe: jest.fn(),
}))

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get dashboard analytics correctly', async () => {
    ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(100)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(50)
    ;(prisma.refreshToken.count as jest.Mock).mockResolvedValue(25)
    ;(prisma.$queryRawUnsafe as jest.Mock).mockImplementation(async (query: string) => {
      if (query.includes('log_date')) {
        return [{ log_date: '2023-01-01', count: BigInt(10) }]
      }
      if (query.includes('entity')) {
        return [{ entity: 'User', count: BigInt(5) }]
      }
      return []
    })

    const result = await AnalyticsService.getDashboardAnalytics()

    expect(result.overview.total_actions_7d).toBe(100)
    expect(result.overview.total_users).toBe(50)
    expect(result.overview.active_users).toBe(25)
    expect(result.daily_activity.length).toBe(1)
    expect(result.daily_activity[0].count).toBe(10)
    expect(result.module_usage.length).toBe(1)
    expect(result.module_usage[0].module).toBe('User')
    expect(result.module_usage[0].requests).toBe(5)
    expect(result.module_usage[0].percentage).toBe(100)
  })
})
