'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDateTime } from '@/utils/format'

// ────────────────────────────────────────
// NotificationPanel — Dropdown สำหรับ in-app notifications
// แสดงรายการ notification + mark as read
// ────────────────────────────────────────

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationPanelProps {
  /** สถานะเปิด/ปิด panel */
  is_open: boolean
  /** callback เมื่อปิด panel */
  onClose: () => void
}

export function NotificationPanel({ is_open, onClose }: NotificationPanelProps) {
  const [notifications, set_notifications] = useState<NotificationItem[]>([])
  const [is_loading, set_is_loading] = useState(false)
  const panel_ref = useRef<HTMLDivElement>(null)

  // ดึง notifications จาก API
  const FetchNotifications = useCallback(async () => {
    set_is_loading(true)
    try {
      const res = await fetch('/api/notification')
      if (res.ok) {
        const json = await res.json()
        set_notifications(json.data ?? [])
      }
    } catch {
      // silent fail — ไม่แสดง error ใน notification panel
    } finally {
      set_is_loading(false)
    }
  }, [])

  // โหลด notifications เมื่อเปิด panel
  useEffect(() => {
    if (is_open) {
      FetchNotifications()
    }
  }, [is_open, FetchNotifications])

  // ปิด panel เมื่อคลิกข้างนอก
  useEffect(() => {
    function HandleClickOutside(event: MouseEvent) {
      if (panel_ref.current && !panel_ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (is_open) {
      document.addEventListener('mousedown', HandleClickOutside)
    }
    return () => document.removeEventListener('mousedown', HandleClickOutside)
  }, [is_open, onClose])

  // Mark notification as read
  const HandleMarkRead = useCallback(async (notification_id: string) => {
    try {
      await fetch(`/api/notification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification_id }),
      })
      set_notifications((prev) =>
        prev.map((n) => (n.id === notification_id ? { ...n, isRead: true } : n))
      )
    } catch {
      // silent fail
    }
  }, [])

  // Mark all as read
  const HandleMarkAllRead = useCallback(async () => {
    try {
      await fetch(`/api/notification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
      set_notifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // silent fail
    }
  }, [])

  // จำนวนที่ยังไม่อ่าน
  const unread_count = notifications.filter((n) => !n.isRead).length

  // Icon ตาม type
  const TYPE_ICONS: Record<string, string> = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
  }

  if (!is_open) return null

  return (
    <div
      ref={panel_ref}
      className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden z-50 shadow-xl rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center p-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          การแจ้งเตือน
          {unread_count > 0 && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
              }}
            >
              {unread_count}
            </span>
          )}
        </h3>
        {unread_count > 0 && (
          <button
            onClick={HandleMarkAllRead}
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto">
        {is_loading ? (
          <div className="flex items-center justify-center p-8">
            <span className="material-symbols-outlined animate-spin" style={{ color: 'var(--color-text-faint)' }}>
              progress_activity
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8" style={{ color: 'var(--color-text-faint)' }}>
            <span className="material-symbols-outlined text-3xl">notifications_off</span>
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex gap-3 p-4 transition-colors cursor-pointer"
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: notification.isRead ? 'transparent' : 'var(--color-surface-mid)',
              }}
              onClick={() => {
                HandleMarkRead(notification.id)
                if (notification.link) {
                  window.location.href = notification.link
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && HandleMarkRead(notification.id)}
              role="button"
              tabIndex={0}
            >
              {/* Icon */}
              <span
                className="material-symbols-outlined text-lg mt-0.5 shrink-0"
                style={{
                  color: notification.type === 'error'
                    ? 'var(--color-error, #e74c3c)'
                    : notification.type === 'warning'
                    ? 'var(--color-warning, #e67e22)'
                    : notification.type === 'success'
                    ? 'var(--color-success, #27ae60)'
                    : 'var(--color-primary)',
                }}
              >
                {TYPE_ICONS[notification.type] || 'info'}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {notification.title}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                  {notification.message}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.isRead && (
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
