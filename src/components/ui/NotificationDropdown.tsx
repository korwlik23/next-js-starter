'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { ja as japaneseLocale } from 'date-fns/locale/ja'
import { th as thaiLocale } from 'date-fns/locale/th'
import { Notification } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { api } from '@/services/apiClient'

interface NotificationData {
  items: Notification[]
  unreadCount: number
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<NotificationData>({ items: [], unreadCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const titleId = `${panelId}-title`
  const t = useTranslations('components.notification')
  const locale = useLocale()
  const dateLocale = locale === 'th' ? thaiLocale : locale === 'ja' ? japaneseLocale : enUS

  useEffect(() => {
    fetchNotifications()
  }, [])

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
      items: prev.items.map((item) => ({ ...item, isRead: true })),
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
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-mid)] focus:outline-none"
        aria-label={t('trigger')}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
          style={{ color: 'var(--color-text)' }}
        >
          notifications
        </span>
        {data.unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white rounded-full bg-[var(--color-error)] border-2 border-[var(--color-surface)]"
            aria-label={t('unreadCount', { count: data.unreadCount })}
          >
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-[var(--radius-md)] shadow-lg border z-50 overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            maxHeight: '80vh',
          }}
        >
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            <h3
              id={titleId}
              className="font-semibold text-sm"
              style={{ color: 'var(--color-text)' }}
            >
              {t('title')}
            </h3>
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading && data.items.length === 0 ? (
              <div
                role="status"
                className="p-8 text-center text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('loading')}
              </div>
            ) : data.items.length === 0 ? (
              <div
                role="status"
                className="p-8 text-center flex flex-col items-center justify-center gap-2"
              >
                <span
                  className="material-symbols-outlined text-4xl"
                  aria-hidden="true"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  notifications_off
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t('empty')}
                </span>
              </div>
            ) : (
              <ul className="flex flex-col">
                {data.items.map((notification) => {
                  const content = (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1" aria-hidden="true">
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
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                    </div>
                  )

                  const commonClassName =
                    'block w-full p-4 border-b text-left hover:bg-[var(--color-surface-low)] transition-colors cursor-pointer'
                  const commonStyle = {
                    borderColor: 'var(--color-border)',
                    backgroundColor: notification.isRead
                      ? 'transparent'
                      : 'var(--color-surface-low)',
                  }
                  const markRead = () => markAsRead(notification.id, notification.isRead)

                  return (
                    <li key={notification.id}>
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={markRead}
                          className={commonClassName}
                          style={commonStyle}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={markRead}
                          className={commonClassName}
                          style={commonStyle}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {data.items.length > 0 && (
            <div className="p-3 text-center border-t border-[var(--color-border)] bg-[var(--color-surface-mid)]">
              <button
                type="button"
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={() => fetchNotifications()}
              >
                {t('refresh')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
