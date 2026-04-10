'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import { formatDateTime, timeAgo } from '@/utils/format'

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
  { label: 'จัดการผู้ใช้', href: '/user', icon: 'manage_accounts', desc: 'ดู/แก้ไข/ลบ ผู้ใช้ในระบบ' },
  { label: 'Audit Log', href: '/settings/audit', icon: 'history', desc: 'ดูประวัติการกระทำทั้งหมด' },
  { label: 'API Keys', href: '/settings/api-keys', icon: 'key', desc: 'จัดการ API Keys' },
  { label: 'จัดการภาษา', href: '/admin/translations', icon: 'translate', desc: 'แก้ไขคำแปลของระบบ' },
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
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Admin Panel
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          ภาพรวมระบบและการจัดการ — ข้อมูลจาก Database แบบ real-time
        </p>
      </div>

      {/* Error message */}
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

      {/* Stats Grid — skeleton + real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {STAT_CONFIG.map((stat) => (
          <div
            key={stat.key}
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: 'var(--color-primary)' }}
              >
                {stat.icon}
              </span>
            </div>
            {isLoading ? (
              <Skeleton width="60%" height="1.75rem" />
            ) : (
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {data?.stats?.[stat.key]?.toLocaleString() ?? '—'}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent System Events — จาก Audit Log จริง */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            เหตุการณ์ล่าสุด
          </h2>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {isLoading ? (
              /* Skeleton loading */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <Skeleton is_circle width={24} height={24} />
                  <div className="flex-1">
                    <Skeleton width="70%" height="0.875rem" className="mb-2" />
                    <Skeleton width="50%" height="0.625rem" />
                  </div>
                </div>
              ))
            ) : data?.recent_events && data.recent_events.length > 0 ? (
              data.recent_events.map((event, idx) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4"
                  style={{
                    borderBottom:
                      idx < data.recent_events.length - 1
                        ? '1px solid var(--color-border)'
                        : 'none',
                  }}
                >
                  <span
                    className="material-symbols-outlined text-base mt-0.5"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    schedule
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {event.action}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {event.detail} • {event.user_name}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                    {timeAgo(event.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-faint)' }}>
                ยังไม่มีเหตุการณ์
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-4 p-4 rounded-lg transition-all hover:translate-x-1"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {action.icon}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {action.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {action.desc}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  arrow_forward
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
