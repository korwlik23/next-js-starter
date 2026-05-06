'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    async function syncUserProfile() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const json = await res.json()
        if (json.data && user) {
          setUser({
            ...user,
            name: json.data.name ?? user.name,
            email: json.data.email ?? user.email,
            roles: json.data.roles ?? user.roles,
            permissions: json.data.permissions ?? user.permissions,
          })
        }
      } catch {
        // Keep cached auth store data if profile sync fails.
      }
    }

    if (user) syncUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return (
      <div>
        <Skeleton width="100%" height="12rem" border_radius="0.75rem" className="mb-8" />
        <div className="ml-36 mb-10">
          <Skeleton width="200px" height="2rem" className="mb-2" />
          <Skeleton width="140px" height="0.625rem" />
        </div>
      </div>
    )
  }

  const initials = user.name
    .split(' ')
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const information = [
    { label: t('name'), value: user.name },
    { label: t('email'), value: user.email },
    { label: t('roles'), value: user.roles?.join(', ') ?? 'member' },
  ]

  return (
    <div>
      <div className="relative mb-6">
        <div
          className="w-full h-36 sm:h-48 rounded-[var(--radius-md)]"
          style={{ backgroundColor: 'var(--color-surface-high)' }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: 'var(--color-text-faint)' }}
            >
              panorama
            </span>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-4 sm:left-8 translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-md)] border-4 flex items-center justify-center text-xl sm:text-2xl font-bold"
          style={{
            backgroundColor: 'var(--color-surface-high)',
            borderColor: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {initials}
        </div>

        <div className="absolute bottom-4 right-4 flex gap-3">
          <Link href="/settings" className="btn-primary text-[10px] py-2 px-4">
            {t('editProfile')}
          </Link>
        </div>
      </div>

      <div className="mt-14 sm:mt-0 sm:ml-36 mb-6 sm:mb-8">
        <h1
          className="text-2xl sm:text-3xl font-extrabold uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          {user.name}
        </h1>
        <p className="label-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
          {user.roles?.join(' / ') ?? t('member')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="space-y-5 sm:space-y-6">
          <section>
            <h3 className="label-xs mb-4" style={{ color: 'var(--color-text-subtle)' }}>
              {t('information')}
            </h3>
            <div className="space-y-3">
              {information.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 sm:flex-row sm:justify-between py-2"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <span className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {user.permissions && user.permissions.length > 0 && (
            <section>
              <h3 className="label-xs mb-4" style={{ color: 'var(--color-text-subtle)' }}>
                {t('permissions')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.permissions.slice(0, 10).map((perm) => (
                  <span
                    key={perm}
                    className="label-xs px-2 py-1"
                    style={{
                      border: '1px solid var(--color-border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {perm}
                  </span>
                ))}
                {user.permissions.length > 10 && (
                  <span className="label-xs px-2 py-1" style={{ color: 'var(--color-text-faint)' }}>
                    {t('more', { count: user.permissions.length - 10 })}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <section className="editorial-card-elevated p-4 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  {t('securitySummary')}
                </h3>
                <p className="text-lg font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
                  {t('accountOverview')}
                </p>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--color-text-faint)' }}
              >
                shield
              </span>
            </div>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    verified_user
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                      {t('accountActive')}
                    </p>
                    <p className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
                      ID: {user.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <span className="label-xs" style={{ color: 'var(--color-success)' }}>
                  {t('active')}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    settings
                  </span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {t('manageAccountSettings')}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="label-xs underline underline-offset-4 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('settings')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
