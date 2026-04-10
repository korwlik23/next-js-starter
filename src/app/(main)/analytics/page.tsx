'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'

// ────────────────────────────────────────
// Analytics Dashboard — ใช้ React Query สำหรับ data fetching
// ข้อมูลจาก /api/analytics + auto-refetch
// ────────────────────────────────────────

/** โครงสร้างข้อมูลจาก API */
interface DailyActivity {
  day: string
  date: string
  count: number
}

interface ModuleUsage {
  module: string
  requests: number
  percentage: number
}

interface AnalyticsData {
  overview: {
    total_actions_7d: number
    total_users: number
    active_users: number
  }
  daily_activity: DailyActivity[]
  module_usage: ModuleUsage[]
}

/** ฟังก์ชันดึงข้อมูล analytics — ใช้กับ React Query */
async function FetchAnalytics(): Promise<AnalyticsData> {
  const result = await api.get<AnalyticsData>('/api/analytics')
  if (result.error) throw new Error(result.error)
  if (!result.data) throw new Error('No data')
  return result.data
}

export default function AnalyticsPage() {
  // ── ใช้ React Query แทน useState/useEffect
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: FetchAnalytics,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // ── คำนวณ max สำหรับ bar chart
  const max_daily_count = Math.max(...(data?.daily_activity?.map((d) => d.count) ?? [1]), 1)

  // ── รายการ overview stats
  const overview_stats = [
    {
      label: 'Actions (7 วัน)',
      value: data?.overview?.total_actions_7d?.toLocaleString() ?? '0',
      icon: 'visibility',
      color: 'var(--color-primary)',
    },
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: data?.overview?.total_users?.toLocaleString() ?? '0',
      icon: 'group',
      color: 'var(--color-success, #27ae60)',
    },
    {
      label: 'Active Users',
      value: data?.overview?.active_users?.toLocaleString() ?? '0',
      icon: 'person',
      color: '#8b5cf6',
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          สถิติการใช้งาน, trends, และข้อมูลเชิงลึกจาก Audit Log
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-lg mb-6 text-sm"
          style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            color: '#e74c3c',
          }}
        >
          {error.message}
        </div>
      )}

      {/* Stats Grid — Skeleton + Real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {overview_stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>
                {stat.icon}
              </span>
            </div>
            {isLoading ? (
              <Skeleton width="50%" height="1.75rem" />
            ) : (
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {stat.value}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Activity — Bar Chart จาก audit_logs */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-sm font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            กิจกรรมรายวัน (7 วันล่าสุด)
          </h2>
          {isLoading ? (
            <div className="flex items-end gap-3 h-40">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1">
                  <Skeleton width="100%" height={`${30 + ((i * 25) % 70)}%`} />
                </div>
              ))}
            </div>
          ) : data?.daily_activity && data.daily_activity.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {data.daily_activity.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {day.count}
                  </span>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${(day.count / max_daily_count) * 100}%`,
                      backgroundColor: 'var(--color-primary)',
                      minHeight: '4px',
                      opacity: 0.8,
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    {day.day.slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-40 text-sm"
              style={{ color: 'var(--color-text-faint)' }}
            >
              ยังไม่มีข้อมูล
            </div>
          )}
        </div>

        {/* Usage by Module — Horizontal Bars */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-sm font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            การใช้งานแยกตาม Module
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton width="40%" height="0.75rem" className="mb-2" />
                  <Skeleton width="100%" height="0.5rem" />
                </div>
              ))}
            </div>
          ) : data?.module_usage && data.module_usage.length > 0 ? (
            <div className="space-y-4">
              {data.module_usage.map((item) => (
                <div key={item.module}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {item.module}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {item.requests.toLocaleString()} requests ({item.percentage}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-surface-mid)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: 'var(--color-primary)',
                        opacity: 0.7 + (item.percentage / 100) * 0.3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-40 text-sm"
              style={{ color: 'var(--color-text-faint)' }}
            >
              ยังไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
