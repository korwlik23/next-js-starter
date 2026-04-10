'use client'

import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui'
import Link from 'next/link'

// ────────────────────────────────────────
// Profile Page — แสดงข้อมูลผู้ใช้จาก Auth Store
// ดึง user data จริงจาก Zustand auth store (ไม่ใช้ mock)
// ────────────────────────────────────────

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  // ── ถ้ายังไม่มี user data → แสดง skeleton
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

  // ── ดึงตัวอักษรย่อจากชื่อผู้ใช้
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div>
      {/* Cover + Avatar Section */}
      <div className="relative mb-8">
        {/* Cover image area */}
        <div
          className="w-full h-48 rounded-xl"
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

        {/* Avatar overlay — ใช้ตัวอักษรย่อจากชื่อจริง */}
        <div
          className="absolute bottom-0 left-8 translate-y-1/2 w-24 h-24 rounded-xl border-4 flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: 'var(--color-surface-high)',
            borderColor: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {initials}
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex gap-3">
          <Link href="/settings" className="btn-primary text-[10px] py-2 px-4">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Name + Role — ข้อมูลจริงจาก auth store */}
      <div className="ml-36 mb-10">
        <h1
          className="text-3xl font-extrabold tracking-tighter uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          {user.name}
        </h1>
        <p className="label-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
          {user.roles?.join(' / ') ?? 'Member'}
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Information */}
        <div className="space-y-8">
          {/* Information */}
          <section>
            <h3 className="label-xs mb-4" style={{ color: 'var(--color-text-subtle)' }}>
              Information
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Roles', value: user.roles?.join(', ') ?? 'member' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between py-2"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <span className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                    {item.label}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Permission Summary */}
          {user.permissions && user.permissions.length > 0 && (
            <section>
              <h3 className="label-xs mb-4" style={{ color: 'var(--color-text-subtle)' }}>
                Permissions
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
                  <span
                    className="label-xs px-2 py-1"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    +{user.permissions.length - 10} more
                  </span>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column — Security */}
        <div className="lg:col-span-2 space-y-8">
          <section className="editorial-card-elevated p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  Security Summary
                </h3>
                <p
                  className="text-lg font-bold mt-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Account Overview
                </p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-text-faint)' }}>
                shield
              </span>
            </div>
            <div className="space-y-3">
              {/* Account status */}
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
                      Account Active
                    </p>
                    <p className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
                      ID: {user.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <span className="label-xs" style={{ color: 'var(--color-success)' }}>
                  Active
                </span>
              </div>

              {/* Quick links */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    settings
                  </span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    Manage Account Settings
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="label-xs underline underline-offset-4 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Settings
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
