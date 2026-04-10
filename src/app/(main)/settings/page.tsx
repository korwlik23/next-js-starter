'use client'

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui'

// ────────────────────────────────────────
// Settings Page — แก้ไข profile + password จริง
// เชื่อม form กับ API /api/user/[id] + toast notifications
// ────────────────────────────────────────

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  // ── Form state สำหรับ profile
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [is_saving_profile, setIsSavingProfile] = useState(false)

  // ── Form state สำหรับ password
  const [current_password, setCurrentPassword] = useState('')
  const [new_password, setNewPassword] = useState('')
  const [confirm_password, setConfirmPassword] = useState('')
  const [is_saving_password, setIsSavingPassword] = useState(false)

  // ── Submit profile changes — ส่งไป API จริง
  const HandleSaveProfile = useCallback(async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const result = await api.patch(`/api/user/${user.id}`, { name, email })
      if (result.error) {
        toast.error(result.error)
        return
      }
      // อัพเดท auth store ด้วยข้อมูลใหม่
      setUser({ ...user, name, email })
      toast.success('บันทึกข้อมูลสำเร็จ')
    } catch {
      toast.error('ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setIsSavingProfile(false)
    }
  }, [user, name, email, setUser])

  // ── Submit password change
  const HandleChangePassword = useCallback(async () => {
    if (!user) return
    if (new_password !== confirm_password) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (new_password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    setIsSavingPassword(true)
    try {
      const result = await api.patch(`/api/user/${user.id}`, {
        currentPassword: current_password,
        password: new_password,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้')
    } finally {
      setIsSavingPassword(false)
    }
  }, [user, current_password, new_password, confirm_password])

  // ── Loading state (ไม่มี user)
  if (!user) {
    return (
      <div>
        <Skeleton width="300px" height="2.5rem" className="mb-4" />
        <Skeleton width="100%" height="20rem" border_radius="0.75rem" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-12">
        <p className="label-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
          Administrative Panel
        </p>
        <h1
          className="text-4xl font-extrabold tracking-tighter"
          style={{ color: 'var(--color-primary)' }}
        >
          Account Settings
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          จัดการ profile, ตั้งค่าความปลอดภัย, และอัปเดตข้อมูลบัญชีของคุณ
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information — เชื่อมกับ API จริง */}
          <section className="editorial-card-elevated p-6">
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Profile Information
              </h2>
              <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
                Public Details
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="label-xs block mb-2"
                  style={{ color: 'var(--color-text-subtle)' }}
                  htmlFor="settings-name"
                >
                  Full Name
                </label>
                <input
                  id="settings-name"
                  className="editorial-input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="label-xs block mb-2"
                  style={{ color: 'var(--color-text-subtle)' }}
                  htmlFor="settings-email"
                >
                  Email Address
                </label>
                <input
                  id="settings-email"
                  className="editorial-input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Account Security — เปลี่ยน password จริง */}
          <section className="editorial-card-elevated p-6">
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Change Password
              </h2>
              <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
                Authentication
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="label-xs block mb-2"
                  style={{ color: 'var(--color-text-subtle)' }}
                  htmlFor="current-pw"
                >
                  Current Password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  className="editorial-input w-full"
                  value={current_password}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="label-xs block mb-2"
                    style={{ color: 'var(--color-text-subtle)' }}
                    htmlFor="new-pw"
                  >
                    New Password
                  </label>
                  <input
                    id="new-pw"
                    type="password"
                    className="editorial-input w-full"
                    value={new_password}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label
                    className="label-xs block mb-2"
                    style={{ color: 'var(--color-text-subtle)' }}
                    htmlFor="confirm-pw"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-pw"
                    type="password"
                    className="editorial-input w-full"
                    value={confirm_password}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={HandleChangePassword}
                  disabled={is_saving_password || !current_password || !new_password}
                  className="btn-secondary text-[10px] py-2 px-4 disabled:opacity-40"
                >
                  {is_saving_password ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </div>
          </section>

          {/* Action buttons — submit profile */}
          <div className="flex gap-4">
            <button
              onClick={HandleSaveProfile}
              disabled={is_saving_profile}
              className="btn-primary disabled:opacity-50"
            >
              {is_saving_profile ? 'กำลังบันทึก...' : 'Save Changes'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setName(user.name)
                setEmail(user.email)
              }}
            >
              Discard
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Account Tier */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: 'var(--color-surface-low)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="label-xs" style={{ color: 'var(--color-text-subtle)' }}>
                Account Info
              </h3>
              <span
                className="label-xs px-2 py-0.5"
                style={{
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {user.roles?.[0] ?? 'Member'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              User ID: <span className="font-mono text-xs">{user.id.slice(0, 16)}...</span>
            </p>
          </div>

          {/* Quick links */}
          <div className="editorial-card-elevated p-6">
            <h3 className="label-xs mb-4" style={{ color: 'var(--color-text-subtle)' }}>
              Quick Links
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Billing & Subscription', href: '/billing', icon: 'payments' },
                { label: 'View Profile', href: '/profile', icon: 'person' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 py-2 text-sm transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span className="material-symbols-outlined text-base">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
