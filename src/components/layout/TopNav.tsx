'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationPanel } from '@/components/layout/NotificationPanel'
import { SearchInput } from '@/components/ui/SearchInput'

// ────────────────────────────────────────
// TopNav — แถบนำทางด้านบน
// ตาม editorial template: glassmorphism, search + actions
// เพิ่ม NotificationPanel dropdown
// ────────────────────────────────────────

interface TopNavProps {
  title?: string
}

export function TopNav({ title: _title }: TopNavProps) {
  // สถานะเปิด/ปิด notification panel
  const [is_notification_open, set_is_notification_open] = useState(false)

  // Toggle notification panel
  const HandleToggleNotification = useCallback(() => {
    set_is_notification_open((prev) => !prev)
  }, [])

  // ปิด notification panel
  const HandleCloseNotification = useCallback(() => {
    set_is_notification_open(false)
  }, [])

  return (
    <header
      className="fixed top-0 right-0 h-16 z-40 flex justify-between items-center px-8 glass-overlay"
      style={{
        width: 'calc(100% - var(--sidebar-width))',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Search — ช่องค้นหาด้านซ้าย */}
      <div className="flex-1 max-w-md">
        <SearchInput
          placeholder="Search..."
          query_param="q"
          size="sm"
          className="border-0"
        />
      </div>

      {/* Actions — icons ด้านขวา */}
      <div className="flex items-center gap-6">
        {/* สลับหน้าจอ ThemeToggle */}
        <ThemeToggle />

        {/* Notifications bell — เปิด/ปิด panel */}
        <div className="relative">
          <button
            onClick={HandleToggleNotification}
            className="transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-subtle)' }}
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[1.2rem]">notifications</span>
          </button>

          {/* Notification dropdown panel */}
          <NotificationPanel
            is_open={is_notification_open}
            onClose={HandleCloseNotification}
          />
        </div>

        {/* Settings gear */}
        <Link
          href="/settings"
          className="transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-subtle)' }}
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[1.2rem]">settings</span>
        </Link>

        {/* User avatar badge — ตัวอักษรย่อ */}
        <div
          className="h-8 w-8 rounded-sm flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          ED
        </div>
      </div>
    </header>
  )
}
