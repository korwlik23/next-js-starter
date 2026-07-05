'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { SidebarGroup } from '@/components/layout/SidebarGroup'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { labelKey: 'dashboard', href: '/dashboard', icon: 'dashboard' },
  { labelKey: 'analytics', href: '/analytics', icon: 'analytics' },
  { labelKey: 'billing', href: '/billing', icon: 'payments' },
  { labelKey: 'settings', href: '/settings', icon: 'settings' },
] as const

const MANAGEMENT_ITEMS = [
  { labelKey: 'users', href: '/user', icon: 'group' },
  { labelKey: 'roles', href: '/role', icon: 'verified_user' },
  { labelKey: 'auditLogs', href: '/admin/audit-logs', icon: 'history' },
  { labelKey: 'translations', href: '/admin/translations', icon: 'translate' },
] as const

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const tNav = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  const renderNavLink = (item: {
    labelKey: Parameters<typeof tNav>[0]
    href: string
    icon: string
  }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onClose()}
        className={clsx(
          'group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-200',
          isActive ? 'font-bold' : 'hover:bg-[var(--color-surface)] hover:opacity-90'
        )}
        style={
          isActive
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
          style={{ color: isActive ? 'var(--color-success)' : 'inherit' }}
        >
          {item.icon}
        </span>
        <span>{tNav(item.labelKey)}</span>
      </Link>
    )
  }

  return (
    <>
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
            aria-label={tNav('closeNavigation')}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3" aria-label="Main navigation">
          {renderNavLink(NAV_ITEMS[0])}
          <SidebarGroup
            id="management"
            label={tNav('management')}
            icon="tune"
            active={MANAGEMENT_ITEMS.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + '/')
            )}
          >
            {MANAGEMENT_ITEMS.map((item) => renderNavLink(item))}
          </SidebarGroup>
          {NAV_ITEMS.slice(1).map((item) => renderNavLink(item))}
        </nav>

        <div className="px-4 pt-4 pb-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <LanguageSwitcher className="mb-4 w-full justify-center sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/profile"
              onClick={() => onClose()}
              className="flex items-center gap-3 min-w-0 flex-1 group transition-opacity hover:opacity-80"
            >
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p
                  className="text-xs font-bold truncate group-hover:underline"
                  style={{ color: 'var(--color-text)' }}
                >
                  {user?.name ?? 'Admin User'}
                </p>
                <p
                  className="text-[10px] truncate mt-0.5"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  {tNav('viewProfile')}
                </p>
              </div>
            </Link>

            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 shrink-0 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-surface-mid)]"
              style={{ color: 'var(--color-text-faint)' }}
              title={tAuth('logout')}
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                clearUser()
                window.location.href = '/login'
              }}
            >
              <span className="material-symbols-outlined text-[1.15rem]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
