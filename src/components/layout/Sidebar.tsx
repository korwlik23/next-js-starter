'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'

// ────────────────────────────────────────
// nav items — รายการเมนูหลักของ sidebar
// ────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Users', href: '/user', icon: 'group' },
  { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  { label: 'Billing', href: '/billing', icon: 'payments' },
  { label: 'Admin', href: '/admin', icon: 'admin_panel_settings' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

// ────────────────────────────────────────
// Sidebar — แถบนำทางด้านซ้าย
// ────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  return (
    <>
      {/* Overlay สำหรับ mobile เมื่อเปิด sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'h-screen flex flex-col py-4 shadow-[12px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out',
          'fixed inset-y-0 left-0 z-[var(--z-drawer)] lg:sticky lg:top-0 lg:translate-x-0 lg:z-10',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          width: 'min(86vw, var(--sidebar-width))',
          backgroundColor: 'var(--color-surface-low)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="flex justify-between items-center px-4 sm:px-5 mb-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm">
              <span className="material-symbols-outlined text-[1.25rem]">article</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black" style={{ color: 'var(--color-text)' }}>
                Editorial
              </h1>
              <p
                className="truncate text-xs font-medium"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                CMS Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden h-10 w-10 rounded-[var(--radius-md)] text-gray-500 hover:bg-[var(--color-surface-mid)] hover:text-gray-700"
            aria-label="Close navigation"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation — รายการเมนู */}
        <nav className="flex-1 flex flex-col gap-1 px-3" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const is_active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={clsx(
                  'group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-200',
                  is_active ? 'font-bold' : 'hover:bg-[var(--color-surface)] hover:opacity-90'
                )}
                style={
                  is_active
                    ? {
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        boxShadow: 'inset 3px 0 0 var(--color-success)',
                      }
                    : {
                        color: 'var(--color-text-subtle)',
                      }
                }
              >
                <span
                  className="material-symbols-outlined text-[1.1rem]"
                  style={{ color: is_active ? 'var(--color-success)' : 'inherit' }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile — แสดงข้อมูลผู้ใช้ด้านล่าง */}
        <div className="px-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>
                {user?.name ?? 'Admin User'}
              </p>
              <button
                type="button"
                className="text-[10px] transition-colors hover:opacity-70"
                style={{ color: 'var(--color-text-faint)' }}
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  clearUser()
                  window.location.href = '/login'
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
