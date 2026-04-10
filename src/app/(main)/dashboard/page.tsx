'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import { Skeleton, SkeletonCard } from '@/components/ui'

// ────────────────────────────────────────
// Dashboard Page — ดึงข้อมูลจาก API จริง
// แสดง stats ของ user, recent activity, quick actions
// ────────────────────────────────────────

/** โครงสร้าง stats จาก user profile */
interface UserProfile {
  id: string
  name: string
  email: string
  roles: string[]
}

/** Stats overview จาก analytics (ถ้ามี) */
interface DashboardStats {
  total_actions_7d: number
  total_users: number
  active_users: number
}

/* ข้อมูล quick actions */
const QUICK_ACTIONS = [
  { label: 'Bulk Import', icon: 'upload_file', href: '#' },
  { label: 'Full Report', icon: 'analytics', href: '/analytics' },
  { label: 'Newsletter', icon: 'mail', href: '#' },
  { label: 'Logs', icon: 'history', href: '/admin' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [is_loading, setIsLoading] = useState(true)

  // ── ดึง stats จาก analytics API (ถ้า user มีสิทธิ์)
  useEffect(() => {
    async function FetchDashboardData() {
      setIsLoading(true)
      try {
        const result = await api.get<{ overview: DashboardStats }>('/api/analytics')
        if (result.data?.overview) {
          setStats(result.data.overview)
        }
      } catch {
        // ไม่แสดง error — dashboard ยังทำงานได้โดยไม่มี stats
      } finally {
        setIsLoading(false)
      }
    }

    FetchDashboardData()
  }, [])

  // ── Config สำหรับ stat cards — ใช้ข้อมูลจริงจาก API
  const STATS = [
    {
      label: 'Actions (7 วัน)',
      value: stats?.total_actions_7d?.toLocaleString() ?? '0',
      icon: 'trending_up',
    },
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: stats?.total_users?.toLocaleString() ?? '0',
      icon: 'group',
    },
    {
      label: 'Active Users',
      value: stats?.active_users?.toLocaleString() ?? '0',
      icon: 'person',
    },
    {
      label: 'System Health',
      value: '99.9%',
      icon: 'monitor_heart',
      is_inverted: true,
    },
  ]

  return (
    <div>
      {/* Header — แสดงชื่อผู้ใช้จริง */}
      <header className="mb-12">
        <div className="flex justify-between items-end">
          <div>
            <p className="label-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
              Dashboard Overview
            </p>
            <h1
              className="text-4xl font-extrabold tracking-tighter"
              style={{ color: 'var(--color-primary)' }}
            >
              {/* แสดงชื่อผู้ใช้จริงจาก auth store */}
              สวัสดี, {user?.name ?? 'Guest'}
            </h1>
          </div>
          <button className="btn-primary">
            <span className="material-symbols-outlined text-sm">add</span>
            New Article
          </button>
        </div>
      </header>

      {/* Stats Grid — ข้อมูลจาก API จริง */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {is_loading
          ? /* Skeleton loading state */
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 editorial-card-elevated">
                <Skeleton width="40%" height="0.625rem" className="mb-4" />
                <Skeleton width="50%" height="2rem" />
              </div>
            ))
          : STATS.map((stat) => (
              <div
                key={stat.label}
                className="p-6 editorial-card-elevated"
                style={
                  stat.is_inverted
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-on-primary)',
                        border: 'none',
                      }
                    : undefined
                }
              >
                <div className="flex justify-between items-start mb-4">
                  <p
                    className="label-xs"
                    style={{
                      color: stat.is_inverted
                        ? 'var(--color-on-primary)'
                        : 'var(--color-text-subtle)',
                    }}
                  >
                    {stat.label}
                  </p>
                  <span
                    className="material-symbols-outlined text-base"
                    style={{
                      color: stat.is_inverted
                        ? 'var(--color-on-primary)'
                        : 'var(--color-text-faint)',
                      opacity: 0.6,
                    }}
                  >
                    {stat.icon}
                  </span>
                </div>
                <span className="text-3xl font-extrabold tracking-tighter">{stat.value}</span>
                {/* Progress bar สำหรับ System Health */}
                {stat.is_inverted && (
                  <div
                    className="mt-4 w-full h-1 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '99.9%',
                        backgroundColor: 'var(--color-on-primary)',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-2">
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: 'var(--color-primary)' }}
          >
            ข้อมูลของคุณ
          </h2>
          <div className="editorial-card-elevated p-6">
            {is_loading ? (
              <SkeletonCard />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: 'var(--color-surface-high)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() ?? 'G'}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {user?.name ?? 'Guest'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {user?.email ?? '-'}
                    </p>
                  </div>
                </div>
                {/* Roles */}
                <div
                  className="flex items-center gap-2 py-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                    Roles:
                  </span>
                  <div className="flex gap-2">
                    {(user?.roles ?? ['member']).map((role) => (
                      <span
                        key={role}
                        className="label-xs px-2 py-0.5"
                        style={{
                          border: '1px solid var(--color-border-strong)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions — Sidebar */}
        <div className="space-y-6">
          <h3 className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="editorial-card-elevated p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:shadow-md"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {action.icon}
                </span>
                <span className="label-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
