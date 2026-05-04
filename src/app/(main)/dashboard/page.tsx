'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

// ────────────────────────────────────────
// Dashboard Page — ดึงข้อมูลจาก API จริง
// ────────────────────────────────────────

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
  { label: 'Create User', icon: 'person_add', href: '/user/create' },
  { label: 'Full Report', icon: 'analytics', href: '/analytics' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: 'Audit Logs', icon: 'history', href: '/settings/audit' },
]

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

        if (healthResult.data) setHealth(healthResult.data)
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

  const STATS = [
    {
      label: 'Actions (7 วัน)',
      value: stats?.total_actions_7d?.toLocaleString() ?? 'Unavailable',
      icon: 'trending_up',
    },
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: stats?.total_users?.toLocaleString() ?? 'Unavailable',
      icon: 'group',
    },
    {
      label: 'Active Users',
      value: stats?.active_users?.toLocaleString() ?? 'Unavailable',
      icon: 'person',
    },
    {
      label: 'System Health',
      value: health_score === null ? 'Unknown' : `${health_score}%`,
      icon: 'monitor_heart',
      progress: health_score ?? 0,
    },
  ]

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-full pb-12 animate-in fade-in duration-700">
      {/* 1. HERO SECTION (Primary Focus) */}
      <header className="relative z-10 w-full pt-2">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" />
              <p
                className="label-xs tracking-[0.2em]"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Platform Status: {platform_status}
              </p>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold"
              style={{ color: 'var(--color-primary)' }}
            >
              ยินดีต้อนรับ, {user?.name?.split(' ')[0] ?? 'Guest'}
            </h1>
            <p
              className="text-sm md:text-base font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              นี่คือภาพรวมของระบบและกิจกรรมล่าสุดใน Tenant ของคุณวันนี้
            </p>
          </div>
          <Link
            href="/user/create"
            className="btn-primary w-full lg:w-auto shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="text-sm font-black uppercase tracking-widest">Create User</span>
          </Link>
        </div>
      </header>

      {load_error && (
        <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-4 text-sm font-medium text-[var(--color-error)]">
          {load_error}
        </div>
      )}

      {/* 2. STAT CARDS (Primary & Secondary Metrics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {is_loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 editorial-card-elevated h-32" />
            ))
          : STATS.map((stat, idx) => {
              // ทำให้ Active Users (index 2) เป็น Primary Highlight
              const is_primary = idx === 2
              return (
                <div
                  key={stat.label}
                  className={`p-4 sm:p-5 editorial-card-elevated shadow-sm flex flex-col justify-between min-h-[128px] transition-all duration-300 hover:shadow-md group cursor-default`}
                  style={{
                    backgroundColor: is_primary ? 'var(--color-primary)' : 'var(--color-surface)',
                    borderColor: is_primary ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <p
                        className="label-xs"
                        style={{
                          color: is_primary
                            ? 'var(--color-on-primary)'
                            : 'var(--color-text-subtle)',
                        }}
                      >
                        {stat.label}
                      </p>
                      <span
                        className={`material-symbols-outlined text-xl transition-transform group-hover:rotate-12`}
                        style={{
                          color: is_primary ? 'var(--color-on-primary)' : 'var(--color-text-faint)',
                        }}
                      >
                        {stat.icon}
                      </span>
                    </div>
                    <span
                      className={`${stat.value === 'Unavailable' ? 'text-xl' : 'text-3xl'} font-extrabold`}
                      style={{
                        color: is_primary ? 'var(--color-on-primary)' : 'var(--color-primary)',
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  {'progress' in stat && (
                    <div className="mt-4 w-full h-1.5 rounded-full bg-[var(--color-surface-dim)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-1000"
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                  )}
                  {is_primary && (
                    <div
                      className="text-[10px] font-bold mt-2 flex items-center gap-1"
                      style={{ color: 'var(--color-on-primary)' }}
                    >
                      <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                      Live tracking active
                    </div>
                  )}
                </div>
              )
            })}
      </section>

      {/* 3. MAIN CONTENT (Left: Analysis | Right: Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full">
        {/* Left Column (Insight Area) */}
        <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6 min-w-0 w-full">
          {/* Activity Analytics Chart */}
          <div className="editorial-card-elevated p-4 sm:p-5 shadow-sm w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
              <div>
                <h2
                  className="text-xl font-bold tracking-tight mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  การเข้าถึงระบบ
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  จำนวนครั้งที่มีกิจกรรมในช่วง 7 วันล่าสุด
                </p>
              </div>
              <div className="flex bg-[var(--color-surface-mid)] p-1 rounded-[var(--radius-sm)]">
                <button className="px-3 py-1 text-[10px] font-bold bg-[var(--color-surface)] shadow-sm rounded-sm">
                  7 วัน
                </button>
                <button className="px-3 py-1 text-[10px] font-bold text-[var(--color-text-faint)]">
                  30 วัน
                </button>
              </div>
            </div>

            <div className="h-[220px] w-full flex items-center justify-center">
              {is_loading ? (
                <Skeleton width="100%" height="100%" />
              ) : (
                is_mounted &&
                (daily_activity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={daily_activity}
                      margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="6 6"
                        vertical={false}
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--color-text-faint)', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--color-text-faint)', fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                          padding: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-primary)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorActive)"
                        dot={{ r: 4, fill: 'var(--color-primary)' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-text-faint)]">
                      bar_chart
                    </span>
                    <p className="text-sm font-bold text-[var(--color-text-subtle)]">
                      No activity data yet
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Profile — Tertiary Content */}
          <div className="editorial-card-elevated p-4 sm:p-5 shadow-sm w-full bg-[var(--color-surface-low)] border-dashed">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg shadow-black/10">
                {user?.name?.[0]?.toUpperCase() ?? 'G'}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {user?.name ?? 'Admin User'}
                  </h3>
                  <span className="label-xs px-2 py-0.5 bg-[var(--color-surface-high)] rounded-sm text-[var(--color-primary)] border border-[var(--color-border-strong)]">
                    {user?.roles?.[0] ?? 'Staff'}
                  </span>
                </div>
                <p
                  className="text-sm font-medium mb-6"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  {user?.email ?? '-'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">
                      Actions Last 7 Days
                    </span>
                    <p
                      className="mt-1 text-2xl font-black"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {stats?.total_actions_7d?.toLocaleString() ?? 'Unavailable'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">
                      Health Checks Passing
                    </span>
                    <p
                      className="mt-1 text-2xl font-black"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {health_score === null
                        ? 'Unknown'
                        : `${health_checks.filter(Boolean).length}/${health_checks.length}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Control Panel) */}
        <div className="lg:col-span-4 flex flex-col gap-5 w-full">
          <section className="editorial-card-elevated p-1 shadow-md bg-[var(--color-primary)] overflow-hidden">
            <div className="p-5 text-[var(--color-on-primary)]">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-1">Quick Actions</h3>
              <p className="text-[10px] opacity-70">เข้าถึงเมนูที่คุณใช้บ่อยที่สุด</p>
            </div>
            <div className="grid grid-cols-2 gap-[1px] bg-[var(--color-border-strong)]">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex min-h-28 flex-col items-center justify-center py-5 gap-3 bg-[var(--color-surface)] transition-all hover:bg-[var(--color-surface-low)] active:bg-[var(--color-surface-mid)] group"
                >
                  <span
                    className="material-symbols-outlined text-2xl transition-transform group-hover:scale-125"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {action.icon}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] flex flex-col gap-4 shadow-sm bg-[var(--color-surface)]">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-surface-mid)]">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                support_agent
              </span>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                ต้องการความช่วยเหลือ?
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-subtle)' }}>
                หากคุณมีปัญหาในการตั้งค่าระบบ สามารถติดต่อทีม Support
                หรืออ่านคู่มือการใช้งานได้ตลอดเวลา
              </p>
            </div>
            <Link
              href="/docs"
              className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[var(--color-surface-low)] border border-[var(--color-border)] rounded-sm hover:bg-[var(--color-surface-mid)] transition-colors"
            >
              ดูคู่มือ <span className="material-symbols-outlined text-sm">menu_book</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
