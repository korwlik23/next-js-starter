'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// nav items — รายการเมนูหลักของ sidebar
// ────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Content', href: '/content', icon: 'article' },
  { label: 'Users', href: '/users', icon: 'group' },
  { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  { label: 'Billing', href: '/billing', icon: 'payments' },
  { label: 'Admin', href: '/admin', icon: 'admin_panel_settings' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

// ────────────────────────────────────────
// Sidebar — แถบนำทางด้านซ้าย
// ตาม editorial template: minimal, tonal layering
// Light: bg-neutral-50, Dark: bg-neutral-900
// Active item: border-l-4 + bg ที่ต่างจาก sidebar
// ────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="h-screen w-64 fixed left-0 top-0 flex flex-col py-8 z-50 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface-low)',
        borderRight: 'none',
      }}
    >
      {/* Brand — ชื่อแอปและ subtitle */}
      <div className="px-8 mb-12">
        <h1
          className="text-xl font-bold tracking-tighter"
          style={{ color: 'var(--color-primary)' }}
        >
          Editorial
        </h1>
        <p
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          CMS Admin
        </p>
      </div>

      {/* Navigation — รายการเมนู */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          /* ตรวจสอบว่า item นี้ active หรือไม่ */
          const is_active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200',
                is_active
                  ? 'font-bold border-l-4'
                  : 'border-l-4 border-transparent hover:opacity-80'
              )}
              style={
                is_active
                  ? {
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-primary)',
                      borderLeftColor: 'var(--color-primary)',
                    }
                  : {
                      color: 'var(--color-text-subtle)',
                    }
              }
            >
              <span className="material-symbols-outlined text-[1.1rem]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile — แสดงข้อมูลผู้ใช้ด้านล่าง */}
      <div
        className="px-6 pt-8"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: 'var(--color-surface-high)',
              color: 'var(--color-text)',
            }}
          >
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <div className="overflow-hidden">
            <p
              className="text-xs font-bold truncate"
              style={{ color: 'var(--color-text)' }}
            >
              Admin User
            </p>
            <Link
              href="/api/auth/logout"
              prefetch={false}
              className="text-[10px] transition-colors hover:opacity-70"
              style={{ color: 'var(--color-text-faint)' }}
              onClick={async (e) => {
                e.preventDefault()
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/login'
              }}
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
