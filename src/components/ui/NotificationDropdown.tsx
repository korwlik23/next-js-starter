'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/services/apiClient'
import { Notification } from '@prisma/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

interface NotificationData {
  items: Notification[]
  unreadCount: number
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<NotificationData>({ items: [], unreadCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ดึงข้อมูลเมื่อ component mount (หรือเมื่อ dropdown เปิด)
  useEffect(() => {
    fetchNotifications()
  }, [])

  // ปิด dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const res = await api.get<NotificationData>('/api/notification?limit=10')
      if (res.data) {
        setData(res.data)
      }
    } catch {
      console.error('Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAllRead = async () => {
    await api.patch('/api/notification', { markAllRead: true })
    setData((prev) => ({
      items: prev.items.map((i) => ({ ...i, isRead: true })),
      unreadCount: 0,
    }))
  }

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    await api.patch('/api/notification', { notificationId: id })
    setData((prev) => ({
      items: prev.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-colors hover:bg-[var(--color-surface-mid)] focus:outline-none"
        aria-label="การแจ้งเตือน"
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--color-text)' }}>
          notifications
        </span>
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white rounded-full bg-[var(--color-error)] border-2 border-[var(--color-surface)]">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-lg border z-50 overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            maxHeight: '80vh',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              การแจ้งเตือน
            </h3>
            {data.unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                ทำเครื่องหมายอ่านทั้งหมด
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {isLoading && data.items.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                กำลังโหลด...
              </div>
            ) : data.items.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <span
                  className="material-symbols-outlined text-4xl"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  notifications_off
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  ไม่มีการแจ้งเตือนใหม่
                </span>
              </div>
            ) : (
              <ul className="flex flex-col">
                {data.items.map((notification) => {
                  const content = (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <span
                          className="material-symbols-outlined"
                          style={{
                            color:
                              notification.type === 'success'
                                ? 'var(--color-success)'
                                : notification.type === 'error'
                                  ? 'var(--color-error)'
                                  : notification.type === 'warning'
                                    ? 'var(--color-warning)'
                                    : 'var(--color-info)',
                          }}
                        >
                          {notification.type === 'success'
                            ? 'check_circle'
                            : notification.type === 'error'
                              ? 'error'
                              : notification.type === 'warning'
                                ? 'warning'
                                : 'info'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${notification.isRead ? 'font-medium' : 'font-bold'}`}
                          style={{ color: 'var(--color-text)' }}
                        >
                          {notification.title}
                        </p>
                        <p
                          className="text-xs mt-1 truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-[10px] mt-2 uppercase tracking-wide"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      </div>
                    </div>
                  )

                  const commonProps = {
                    onClick: () => markAsRead(notification.id, notification.isRead),
                    className:
                      'block p-4 border-b hover:bg-[var(--color-surface-low)] transition-colors cursor-pointer',
                    style: {
                      borderColor: 'var(--color-border)',
                      backgroundColor: notification.isRead
                        ? 'transparent'
                        : 'var(--color-surface-low)',
                    },
                  }

                  return (
                    <li key={notification.id}>
                      {notification.link ? (
                        <Link href={notification.link} {...commonProps}>
                          {content}
                        </Link>
                      ) : (
                        <div {...commonProps}>{content}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {data.items.length > 0 && (
            <div className="p-3 text-center border-t border-[var(--color-border)] bg-[var(--color-surface-mid)]">
              <button
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={() => fetchNotifications()}
              >
                รีเฟรชการแจ้งเตือน
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
