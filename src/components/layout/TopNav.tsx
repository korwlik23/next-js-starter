'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationDropdown } from '@/components/ui/NotificationDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import { useAuthStore } from '@/store/authStore'

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
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const title =
    _title ||
    pathname
      .split('/')
      .filter(Boolean)
      .at(-1)
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    'Dashboard'
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  return (
    <header
      className="sticky top-0 flex min-h-16 w-full items-center justify-between gap-3 px-4 glass-overlay sm:px-6 lg:px-8 2xl:px-10"
      style={{
        zIndex: 'var(--z-nav)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Hamburger Menu (Mobile Only) */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden -ml-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-gray-600 hover:bg-[var(--color-surface-mid)] hover:text-gray-900 focus:outline-none"
          aria-label="Open navigation"
          type="button"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="min-w-0 sm:hidden">
          <p className="truncate text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            {title}
          </p>
        </div>

        {/* Search — ช่องค้นหาด้านซ้าย */}
        <div className="hidden w-full max-w-lg sm:block">
          <SearchInput placeholder="Search..." query_param="q" size="sm" />
        </div>
      </div>

      {/* Actions — icons ด้านขวา */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* สลับหน้าจอ ThemeToggle */}
        <ThemeToggle />

        {/* Notifications bell — ใช้คอมโพเนนต์ใหม่ที่เชื่อมต่อ API จริง */}
        <NotificationDropdown />

        {/* Settings gear */}
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-mid)]"
          style={{ color: 'var(--color-text-subtle)' }}
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[1.2rem]">settings</span>
        </Link>

        {/* User avatar badge — ตัวอักษรย่อ */}
        <div
          className="h-9 w-9 rounded-[var(--radius-md)] flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
