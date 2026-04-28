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

const QUICK_ACTIONS = [
  { label: 'Bulk Import', icon: 'upload_file', href: '/user/create' },
  { label: 'Full Report', icon: 'analytics', href: '/analytics' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: 'Audit Logs', icon: 'history', href: '/admin' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [daily_activity, setDailyActivity] = useState<{ day: string; count: number }[]>([])
  const [is_loading, setIsLoading] = useState(true)
  const [is_mounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    async function FetchDashboardData() {
      setIsLoading(true)
      try {
        const result = await api.get<{
          overview: DashboardStats
          daily_activity: { day: string; count: number }[]
        }>('/api/analytics')

        if (result.data) {
          setStats(result.data.overview)
          setDailyActivity(result.data.daily_activity)
        }
      } catch {
        // silent fail
      } finally {
        setIsLoading(false)
      }
    }
    FetchDashboardData()
  }, [])

  const STATS = [
    {
      label: 'Actions (7 วัน)',
      value: stats?.total_actions_7d?.toLocaleString() ?? '0',
      icon: 'trending_up',
    },
    { label: 'ผู้ใช้ทั้งหมด', value: stats?.total_users?.toLocaleString() ?? '0', icon: 'group' },
    { label: 'Active Users', value: stats?.active_users?.toLocaleString() ?? '0', icon: 'person' },
    { label: 'System Health', value: '99.9%', icon: 'monitor_heart', is_inverted: true },
  ]

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-16 animate-in fade-in duration-700">
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
                Platform Status: Operational
              </p>
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tighter"
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
          <button className="btn-primary w-full lg:w-auto shadow-xl shadow-black/10 px-8 py-4 rounded-[var(--radius-lg)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="text-sm font-black uppercase tracking-widest">New Article</span>
          </button>
        </div>
      </header>

      {/* 2. STAT CARDS (Primary & Secondary Metrics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
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
                  className={`p-6 editorial-card-elevated shadow-sm flex flex-col justify-between min-h-[144px] transition-all duration-300 hover:shadow-md hover:-translate-y-1 group cursor-default`}
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
                      className="text-4xl font-extrabold tracking-tighter"
                      style={{
                        color: is_primary ? 'var(--color-on-primary)' : 'var(--color-primary)',
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  {stat.is_inverted && (
                    <div className="mt-4 w-full h-1.5 rounded-full bg-[var(--color-surface-dim)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-1000"
                        style={{ width: '99.9%' }}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column (Insight Area) */}
        <div className="lg:col-span-8 flex flex-col gap-8 min-w-0 w-full">
          {/* Activity Analytics Chart */}
          <div className="editorial-card-elevated p-8 shadow-sm w-full">
            <div className="flex justify-between items-center mb-10">
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
          <div className="editorial-card-elevated p-8 shadow-sm w-full bg-[var(--color-surface-low)] border-dashed">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
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

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">
                      Resource Limit Status
                    </span>
                    <span
                      className="text-[10px] font-black"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {Math.round(((stats?.total_actions_7d ?? 0) / 1000) * 100)}% Used
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--color-surface-dim)]">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, ((stats?.total_actions_7d ?? 0) / 1000) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Control Panel) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
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
                  className="flex flex-col items-center justify-center py-8 gap-4 bg-[var(--color-surface)] transition-all hover:bg-[var(--color-surface-low)] active:bg-[var(--color-surface-mid)] group"
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

          <div className="p-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] flex flex-col gap-4 shadow-sm bg-[var(--color-surface)]">
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
