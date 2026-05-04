'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui'
import { api } from '@/services/apiClient'
import { useAuthStore } from '@/store/authStore'

interface DashboardStats {
  total_actions_7d: number
  total_users: number
  active_users: number
}

interface HealthData {
  env_db?: boolean
  env_jwt?: boolean
  db_connected?: boolean
  bcrypt_works?: boolean
}

const QUICK_ACTIONS = [
  { label: 'Create user', icon: 'person_add', href: '/user/create' },
  { label: 'Analytics', icon: 'analytics', href: '/analytics' },
  { label: 'Team', icon: 'groups', href: '/settings/team' },
  { label: 'Audit logs', icon: 'history', href: '/settings/audit' },
]

const formatMetric = (value: number | undefined) =>
  typeof value === 'number' ? value.toLocaleString() : 'Unavailable'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [daily_activity, setDailyActivity] = useState<{ day: string; count: number }[]>([])
  const [health, setHealth] = useState<HealthData | null>(null)
  const [is_loading, setIsLoading] = useState(true)
  const [is_mounted, setIsMounted] = useState(false)
  const [load_error, setLoadError] = useState('')

  useEffect(() => {
    setIsMounted(true)

    async function FetchDashboardData() {
      setIsLoading(true)

      try {
        const [analyticsResult, healthResult] = await Promise.all([
          api.get<{
            overview: DashboardStats
            daily_activity: { day: string; count: number }[]
          }>('/api/analytics'),
          api.get<HealthData>('/api/health'),
        ])

        if (analyticsResult.data) {
          setStats(analyticsResult.data.overview)
          setDailyActivity(analyticsResult.data.daily_activity)
        } else {
          setStats(null)
          setDailyActivity([])
        }

        setHealth(healthResult.data ?? null)
        setLoadError(analyticsResult.error ?? healthResult.error ?? '')
      } catch {
        setStats(null)
        setDailyActivity([])
        setHealth(null)
        setLoadError('Unable to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    FetchDashboardData()
  }, [])

  const health_checks = health
    ? [health.env_db, health.env_jwt, health.db_connected, health.bcrypt_works]
    : []
  const health_score =
    health_checks.length > 0
      ? Math.round((health_checks.filter(Boolean).length / health_checks.length) * 100)
      : null
  const platform_status =
    health_score === null ? 'Unknown' : health_score === 100 ? 'Operational' : 'Needs Attention'
  const user_name = user?.name?.split(' ')[0] ?? 'Guest'

  const stat_cards = [
    {
      label: 'Actions this week',
      value: formatMetric(stats?.total_actions_7d),
      icon: 'trending_up',
      helper: 'Recorded in audit activity',
      color: 'var(--color-info)',
    },
    {
      label: 'Total users',
      value: formatMetric(stats?.total_users),
      icon: 'group',
      helper: 'All members in this tenant',
      color: 'var(--color-success)',
    },
    {
      label: 'Active users',
      value: formatMetric(stats?.active_users),
      icon: 'person',
      helper: 'Users currently active',
      color: 'var(--color-warning)',
    },
    {
      label: 'System health',
      value: health_score === null ? 'Unknown' : `${health_score}%`,
      icon: 'monitor_heart',
      helper: health_score === 100 ? 'All checks passing' : 'Review health checks',
      color: health_score === 100 ? 'var(--color-success)' : 'var(--color-warning)',
      progress: health_score ?? 0,
    },
  ]

  return (
    <div className="flex w-full max-w-full flex-col gap-5 pb-12 animate-in fade-in duration-500 sm:gap-6">
      <header className="editorial-card-elevated overflow-hidden">
        <div className="flex flex-col gap-6 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-1 text-xs font-bold text-[var(--color-text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]" />
                Platform {platform_status}
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-1 text-xs font-semibold text-[var(--color-text-subtle)]">
                Tenant overview
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black leading-tight text-[var(--color-text)] sm:text-3xl lg:text-4xl">
                ยินดีต้อนรับ, {user_name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
                ภาพรวมผู้ใช้ กิจกรรม และสถานะระบบล่าสุดของ tenant นี้
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
            <Link
              href="/user/create"
              className="btn-primary min-h-12 w-full justify-center shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Create user
            </Link>
            <Link href="/analytics" className="btn-secondary min-h-12 w-full justify-center">
              <span className="material-symbols-outlined text-lg">analytics</span>
              View report
            </Link>
          </div>
        </div>
      </header>

      {load_error && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-error)]/25 bg-[var(--color-error-container)] p-4 text-sm font-medium text-[var(--color-error)]">
          {load_error}
        </div>
      )}

      <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {is_loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="editorial-card-elevated min-h-[148px] p-5">
                <Skeleton width="64%" height={16} />
                <div className="mt-6">
                  <Skeleton width="44%" height={36} />
                </div>
                <div className="mt-6">
                  <Skeleton width="82%" height={10} />
                </div>
              </div>
            ))
          : stat_cards.map((stat) => (
              <article
                key={stat.label}
                className="editorial-card-elevated group flex min-h-[148px] flex-col justify-between overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-3 break-words text-3xl font-black leading-none text-[var(--color-text)]">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-low)]"
                    style={{ color: stat.color }}
                  >
                    <span className="material-symbols-outlined text-[1.35rem]">{stat.icon}</span>
                  </div>
                </div>

                <div className="mt-5">
                  {'progress' in stat && (
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-dim)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${stat.progress}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  )}
                  <p className="text-xs font-medium text-[var(--color-text-subtle)]">
                    {stat.helper}
                  </p>
                </div>
              </article>
            ))}
      </section>

      <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <section className="editorial-card-elevated min-w-0 p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">
                Activity trend
              </p>
              <h2 className="mt-1 text-xl font-black text-[var(--color-text)] sm:text-2xl">
                การใช้งาน 7 วันล่าสุด
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-1 text-xs font-bold text-[var(--color-text-muted)]">
              <span className="material-symbols-outlined text-sm">calendar_month</span>7 days
            </span>
          </div>

          <div className="h-[260px] w-full sm:h-[320px]">
            {is_loading ? (
              <Skeleton width="100%" height="100%" />
            ) : (
              is_mounted &&
              (daily_activity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={daily_activity}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeDasharray="4 6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--color-text-subtle)', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--color-text-subtle)', fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 18px 44px rgba(0,0,0,0.2)',
                        color: 'var(--color-text)',
                        padding: '12px',
                      }}
                    />
                    <Area
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      dataKey="count"
                      dot={{ r: 4, fill: 'var(--color-success)', strokeWidth: 0 }}
                      fill="url(#activityFill)"
                      fillOpacity={1}
                      stroke="var(--color-success)"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-low)] p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-[var(--color-text-faint)]">
                    bar_chart
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-muted)]">
                    No activity data yet
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section className="editorial-card-elevated overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-5">
              <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">
                Quick actions
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--color-text)]">ทำงานต่อได้ทันที</h2>
            </div>
            <div className="grid grid-cols-2">
              {QUICK_ACTIONS.map((action, index) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex min-h-28 flex-col justify-between border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-low)]"
                  style={{
                    borderRight: index % 2 === 0 ? '1px solid var(--color-border)' : undefined,
                    borderBottom: index < 2 ? '1px solid var(--color-border)' : undefined,
                  }}
                >
                  <span className="material-symbols-outlined text-2xl text-[var(--color-text)] transition-transform group-hover:translate-x-1">
                    {action.icon}
                  </span>
                  <span className="text-xs font-black uppercase text-[var(--color-text-muted)]">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="editorial-card-elevated p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-low)] text-[var(--color-success)]">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">
                  Health checks
                </p>
                <p className="mt-1 text-2xl font-black text-[var(--color-text)]">
                  {health_score === null
                    ? 'Unknown'
                    : `${health_checks.filter(Boolean).length}/${health_checks.length}`}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {health_score === 100
                    ? 'Core services are passing.'
                    : 'Some checks need attention before production use.'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="editorial-card-elevated p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-lg font-black text-[var(--color-on-primary)]">
              {user?.name?.[0]?.toUpperCase() ?? 'G'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-black text-[var(--color-text)]">
                  {user?.name ?? 'Admin User'}
                </h2>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-low)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">
                  {user?.roles?.[0] ?? 'Staff'}
                </span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-subtle)]">
                {user?.email ?? '-'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-4 py-3">
              <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">Actions</p>
              <p className="mt-1 text-xl font-black text-[var(--color-text)]">
                {formatMetric(stats?.total_actions_7d)}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-4 py-3">
              <p className="text-xs font-bold uppercase text-[var(--color-text-subtle)]">Health</p>
              <p className="mt-1 text-xl font-black text-[var(--color-text)]">
                {health_score === null ? 'Unknown' : `${health_score}%`}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
