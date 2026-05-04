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
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* 1. PAGE HEADER — Focal Point */}
      <header className="mb-6 pt-2">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Platform Analytics
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          Monitor system performance, user activity trends, and module distribution across your
          tenant.
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-[var(--radius-md)] mb-5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-base">error</span>
          {error.message}
        </div>
      )}

      {/* 2. OVERVIEW STATS — Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {overview_stats.map((stat) => (
          <div
            key={stat.label}
            className="editorial-card-elevated p-4 sm:p-5 flex flex-col justify-between min-h-[124px] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-black uppercase"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {stat.label}
              </p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-low)]">
                <span className="material-symbols-outlined text-lg" style={{ color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className="mt-4">
              {isLoading ? (
                <Skeleton width="60%" height="2.5rem" />
              ) : (
                <p className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                  {stat.value}
                </p>
              )}
              <div
                className="mt-2 flex items-center gap-1 text-[10px] font-bold"
                style={{ color: 'var(--color-text-faint)' }}
              >
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>Updated just now</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. VISUALIZATION GRID — Secondary Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Daily Activity — Custom Bar Chart */}
        <div className="lg:col-span-7 editorial-card-elevated p-4 sm:p-5 shadow-sm h-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2
              className="text-sm font-black uppercase"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              Daily Activity (Last 7 Days)
            </h2>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-50" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
                Activity Count
              </span>
            </div>
          </div>

          <div className="h-[220px] flex items-end justify-between gap-2 sm:gap-4 pt-4">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <Skeleton
                    width="100%"
                    height={`${30 + ((i * 25) % 60)}%`}
                    border_radius="4px 4px 0 0"
                  />
                  <Skeleton width="60%" height="0.5rem" />
                </div>
              ))
            ) : data?.daily_activity && data.daily_activity.length > 0 ? (
              data.daily_activity.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full flex flex-col items-center">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      {day.count} Actions
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all duration-500 bg-[var(--color-primary)]/80 group-hover:bg-[var(--color-primary)] group-hover:opacity-100"
                      style={{
                        height: `${(day.count / max_daily_count) * 160}px`,
                        minHeight: '6px',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-black uppercase"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {day.day.slice(0, 3)}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-faint)]">
                <span className="material-symbols-outlined text-4xl">bar_chart_off</span>
                <p className="text-sm font-bold tracking-tight">No activity recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Module Distribution — Progress Bars */}
        <div className="lg:col-span-5 editorial-card-elevated p-4 sm:p-5 shadow-sm h-full">
          <h2
            className="text-sm font-black uppercase mb-6"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            Module Distribution
          </h2>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-3">
                    <Skeleton width="40%" height="10px" />
                    <Skeleton width="20%" height="10px" />
                  </div>
                  <Skeleton width="100%" height="6px" border_radius="99px" />
                </div>
              ))}
            </div>
          ) : data?.module_usage && data.module_usage.length > 0 ? (
            <div className="space-y-6">
              {data.module_usage.map((item) => (
                <div key={item.module} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-black uppercase"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {item.module}
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-surface-dim)]">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-[var(--color-primary)]"
                      style={{
                        width: `${item.percentage}%`,
                        opacity: 0.6 + (item.percentage / 100) * 0.4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-3 text-[var(--color-text-faint)]">
              <span className="material-symbols-outlined text-4xl">donut_small</span>
              <p className="text-sm font-bold tracking-tight">Data distribution pending</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
