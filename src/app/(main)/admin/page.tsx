'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import { timeAgo } from '@/utils/format'

// ────────────────────────────────────────
// Admin Panel — ใช้ React Query สำหรับ data fetching
// ข้อมูล real-time จาก /api/admin/stats + auto-refetch
// ────────────────────────────────────────

/** โครงสร้างข้อมูล stats จาก API */
interface AdminStats {
  total_users: number
  total_tenants: number
  active_sessions: number
  api_requests_24h: number
}

interface RecentEvent {
  id: string
  action: string
  detail: string
  user_name: string
  user_email: string
  created_at: string
}

interface AdminData {
  stats: AdminStats
  recent_events: RecentEvent[]
}

// ── Config สำหรับ stat cards
const STAT_CONFIG = [
  { key: 'total_users' as const, label: 'ผู้ใช้ทั้งหมด', icon: 'group' },
  { key: 'total_tenants' as const, label: 'Tenants ที่ใช้งาน', icon: 'apartment' },
  { key: 'active_sessions' as const, label: 'Active Sessions', icon: 'devices' },
  { key: 'api_requests_24h' as const, label: 'API Requests (24h)', icon: 'api' },
]

// ── Quick action links
const QUICK_ACTIONS = [
  {
    label: 'จัดการผู้ใช้',
    href: '/user',
    icon: 'manage_accounts',
    desc: 'ดู/แก้ไข/ลบ ผู้ใช้ในระบบ',
  },
  {
    label: 'Audit Log',
    href: '/settings/audit',
    icon: 'history',
    desc: 'ดูประวัติการกระทำทั้งหมด',
  },
  { label: 'API Keys', href: '/settings/api-keys', icon: 'key', desc: 'จัดการ API Keys' },
  {
    label: 'จัดการภาษา',
    href: '/admin/translations',
    icon: 'translate',
    desc: 'แก้ไขคำแปลของระบบ',
  },
  { label: 'Billing', href: '/billing', icon: 'payments', desc: 'ดูข้อมูลบิลและ subscription' },
  { label: 'Analytics', href: '/analytics', icon: 'analytics', desc: 'ดูสถิติการใช้งาน' },
]

/** ฟังก์ชันดึงข้อมูล admin stats — ใช้กับ React Query */
async function FetchAdminStats(): Promise<AdminData> {
  const result = await api.get<AdminData>('/api/admin/stats')
  if (result.error) throw new Error(result.error)
  if (!result.data) throw new Error('No data')
  return result.data
}

export default function AdminPage() {
  // ── ใช้ React Query แทน useState/useEffect
  // staleTime 30 วินาที + refetch ทุก 60 วินาทีอัตโนมัติ
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: FetchAdminStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* 1. PAGE HEADER — High Contrast */}
      <header className="mb-6 pt-2">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Command Center
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          System-wide overview, health metrics, and administrative control tools.
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-[var(--radius-md)] mb-5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-base">error</span>
          {error.message}
        </div>
      )}

      {/* 2. SYSTEM STATS — Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CONFIG.map((stat) => (
          <div
            key={stat.key}
            className="editorial-card-elevated p-4 sm:p-5 flex flex-col justify-between min-h-[124px] shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-black uppercase"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {stat.label}
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-low)] text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-lg">{stat.icon}</span>
              </div>
            </div>
            <div className="mt-4">
              {isLoading ? (
                <Skeleton width="60%" height="2.5rem" />
              ) : (
                <p className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                  {data?.stats?.[stat.key]?.toLocaleString() ?? '—'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* 3. ACTIVITY FEED — Recent Events Timeline */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black uppercase" style={{ color: 'var(--color-primary)' }}>
              Recent System Events
            </h2>
            <span
              className="text-[10px] font-bold py-1 px-2 rounded-full bg-[var(--color-surface-low)]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Live Feed
            </span>
          </div>

          <div className="relative pl-5 sm:pl-8 space-y-4 before:absolute before:left-2 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border)] before:border-dashed before:border-l">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative">
                  <Skeleton width="100%" height="60px" border_radius="var(--radius-lg)" />
                </div>
              ))
            ) : data?.recent_events && data.recent_events.length > 0 ? (
              data.recent_events.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-5 sm:-left-8 top-1.5 w-3 h-3 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-[var(--color-primary)] transition-colors z-10" />

                  <div className="editorial-card-elevated p-4 shadow-sm transition-all">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-1">
                      <p
                        className="text-sm font-black tracking-tight"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {event.action}
                      </p>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: 'var(--color-text-faint)' }}
                      >
                        {timeAgo(event.created_at)}
                      </span>
                    </div>
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {event.detail}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[var(--color-surface-dim)] flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                      </div>
                      <span
                        className="text-[10px] font-black"
                        style={{ color: 'var(--color-text-subtle)' }}
                      >
                        {event.user_name}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center editorial-card-elevated shadow-sm">
                <span
                  className="material-symbols-outlined text-4xl mb-4"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  event_busy
                </span>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-faint)' }}>
                  No recent activity detected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. CONTROL PANEL — Quick Actions Grid */}
        <div className="lg:col-span-5">
          <h2
            className="text-sm font-black uppercase mb-5"
            style={{ color: 'var(--color-primary)' }}
          >
            Control Panel
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="editorial-card-elevated p-4 sm:p-5 flex items-center gap-4 transition-all hover:shadow-md border-transparent hover:border-[var(--color-primary)]/20"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <span className="material-symbols-outlined">{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-black tracking-tight mb-0.5"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {action.label}
                  </p>
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {action.desc}
                  </p>
                </div>
                <span className="material-symbols-outlined text-lg opacity-30 group-hover:opacity-100 transition-opacity">
                  chevron_right
                </span>
              </a>
            ))}
          </div>

          <div className="mt-6 p-4 sm:p-5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase mb-1 opacity-70">Support Status</p>
              <p className="text-sm font-bold">Systems operational</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
