'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationDropdown } from '@/components/ui/NotificationDropdown'
import { SearchInput } from '@/components/ui/SearchInput'

// ────────────────────────────────────────
// TopNav — แถบนำทางด้านบน
// ตาม editorial template: glassmorphism, search + actions
// เพิ่ม NotificationDropdown
// ────────────────────────────────────────

interface TopNavProps {
  title?: string
  onOpenSidebar: () => void
}

export function TopNav({ title: _title, onOpenSidebar }: TopNavProps) {
  return (
    <header
      className="sticky top-0 h-16 flex justify-between items-center px-4 lg:px-8 glass-overlay w-full"
      style={{
        zIndex: 'var(--z-nav)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger Menu (Mobile Only) */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Search — ช่องค้นหาด้านซ้าย */}
        <div className="flex-1 max-w-md hidden sm:block">
          <SearchInput placeholder="Search..." query_param="q" size="sm" className="border-0" />
        </div>
      </div>

      {/* Actions — icons ด้านขวา */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* สลับหน้าจอ ThemeToggle */}
        <ThemeToggle />

        {/* Notifications bell — ใช้คอมโพเนนต์ใหม่ที่เชื่อมต่อ API จริง */}
        <NotificationDropdown />

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
