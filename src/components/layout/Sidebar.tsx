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
          'h-screen flex flex-col py-8 transition-transform duration-300 ease-in-out',
          'fixed inset-y-0 left-0 z-[var(--z-drawer)] lg:sticky lg:top-0 lg:translate-x-0 lg:z-10',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--color-surface-low)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="flex justify-between items-center px-8 mb-12">
          <div>
            <h1
              className="text-xl font-bold tracking-tighter"
              style={{ color: 'var(--color-primary)' }}
            >
              Editorial
            </h1>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
              CMS Admin
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation — รายการเมนู */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const is_active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
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
        <div className="px-6 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
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
