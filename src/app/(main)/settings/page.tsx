'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui'
import Link from 'next/link'

// ────────────────────────────────────────
// Settings Page — แก้ไข profile + password จริง
// เชื่อม form กับ API /api/user/[id] + toast notifications
// ────────────────────────────────────────

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  // ── Form state สำหรับ profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [is_saving_profile, setIsSavingProfile] = useState(false)

  // ── Form state สำหรับ password
  const [current_password, setCurrentPassword] = useState('')
  const [new_password, setNewPassword] = useState('')
  const [confirm_password, setConfirmPassword] = useState('')
  const [is_saving_password, setIsSavingPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

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
  if (!mounted || !user) {
    return (
      <div>
        <Skeleton width="300px" height="2.5rem" className="mb-4" />
        <Skeleton width="100%" height="20rem" border_radius="0.75rem" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* 1. PAGE HEADER — High Contrast & Clear Description */}
      <header className="mb-6 pt-2">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          General Settings
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          Manage your personal details, security preferences, and account metadata.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: Main Form Area (70%) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* PROFILE SECTION — The most used part */}
          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                Profile Information
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                This is how other members of your team will see you.
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-5">
              <div className="grid grid-cols-1 gap-5 max-w-md">
                <div className="group">
                  <label
                    htmlFor="settings-name"
                    className="text-[10px] font-black uppercase block mb-2 transition-colors group-focus-within:text-[var(--color-primary)]"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    Display Name
                  </label>
                  <input
                    id="settings-name"
                    className="editorial-input w-full text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                  <p
                    className="text-[10px] mt-2 italic"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    Your real name or alias.
                  </p>
                </div>

                <div className="group">
                  <label
                    htmlFor="settings-email"
                    className="text-[10px] font-black uppercase block mb-2 transition-colors group-focus-within:text-[var(--color-primary)]"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    Email Address
                  </label>
                  <input
                    id="settings-email"
                    className="editorial-input w-full text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
              </div>
            </div>
            {/* Action Bar for Profile */}
            <div className="px-4 py-4 sm:px-5 bg-[var(--color-surface-low)] border-t border-[var(--color-border)] flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                className="text-xs font-bold px-4 py-2 hover:underline transition-all"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={() => {
                  setName(user.name)
                  setEmail(user.email)
                }}
              >
                Discard
              </button>
              <button
                onClick={HandleSaveProfile}
                disabled={is_saving_profile}
                className="btn-primary text-[10px] font-black uppercase shadow-sm disabled:opacity-50"
              >
                {is_saving_profile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* SECURITY SECTION — Password management */}
          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                Security & Authentication
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                Keep your account secure by using a strong, unique password.
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-6">
              <div className="max-w-md space-y-5">
                <div className="group">
                  <label
                    htmlFor="current-pw"
                    className="text-[10px] font-black uppercase block mb-2"
                    style={{ color: 'var(--color-text-faint)' }}
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

                <div className="grid grid-cols-1 gap-5 pt-4 border-t border-[var(--color-border)] border-dashed">
                  <div className="group">
                    <label
                      htmlFor="new-pw"
                      className="text-[10px] font-black uppercase block mb-2"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      New Password
                    </label>
                    <input
                      id="new-pw"
                      type="password"
                      className="editorial-input w-full"
                      value={new_password}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                    <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-faint)' }}>
                      Must contain letters, numbers, and symbols.
                    </p>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="confirm-pw"
                      className="text-[10px] font-black uppercase block mb-2"
                      style={{ color: 'var(--color-text-faint)' }}
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
              </div>
            </div>
            <div className="px-4 py-4 sm:px-5 bg-[var(--color-surface-low)] border-t border-[var(--color-border)] flex items-center justify-end">
              <button
                onClick={HandleChangePassword}
                disabled={is_saving_password || !current_password || !new_password}
                className="btn-secondary text-[10px] font-black uppercase disabled:opacity-40"
              >
                {is_saving_password ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </section>

          {/* DANGER ZONE (Optional but professional) */}
          <section className="p-4 sm:p-5 border border-[var(--color-error)]/20 rounded-[var(--radius-md)] bg-[var(--color-error)]/5">
            <h2 className="text-sm font-bold mb-1 text-[var(--color-error)]">Danger Zone</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="text-[10px] font-black uppercase px-4 py-2 border border-[var(--color-error)] text-[var(--color-error)] rounded-[var(--radius-md)] hover:bg-[var(--color-error)] hover:text-white transition-all">
              Delete Account
            </button>
          </section>
        </div>

        {/* RIGHT COLUMN: Account Context (30%) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <section className="editorial-card-elevated p-4 sm:p-5 shadow-sm">
            <h3
              className="text-[10px] font-black uppercase mb-5"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Account Details
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Member Role
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {user.roles?.[0] ?? 'Member'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  User Identifier
                </span>
                <span
                  className="text-xs font-mono break-all p-3 bg-[var(--color-surface-low)] rounded-md border border-[var(--color-border)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {user.id}
                </span>
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-5 bg-[var(--color-surface-dim)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <h3
              className="text-[10px] font-black uppercase mb-4"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Quick Links
            </h3>
            <div className="flex flex-col gap-4">
              <Link
                href="/billing"
                className="text-sm font-bold flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="material-symbols-outlined text-base">payments</span> Billing Portal
              </Link>
              <Link
                href="/settings/team"
                className="text-sm font-bold flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="material-symbols-outlined text-base">group</span> Manage Team
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
