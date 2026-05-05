'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import toast from 'react-hot-toast'
import { Skeleton, Input, Button } from '@/components/ui'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ────────────────────────────────────────
// Settings Page — แก้ไข profile + password จริง
// เชื่อม form กับ API /api/user/[id] + toast notifications
// ────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
})
type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
    password: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirmPassword'],
  })
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    setMounted(true)
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      })
    }
  }, [user, profileForm])

  // ── Submit profile changes
  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!user) return
    try {
      const result = await api.patch(`/api/user/${user.id}`, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setUser({ ...user, name: data.name, email: data.email })
      toast.success('บันทึกข้อมูลสำเร็จ')
    } catch {
      toast.error('ไม่สามารถบันทึกข้อมูลได้')
    }
  }

  // ── Submit password change
  const onSubmitPassword = async (data: PasswordFormValues) => {
    if (!user) return
    try {
      const result = await api.patch(`/api/user/${user.id}`, {
        currentPassword: data.currentPassword,
        // ส่ง newPassword + confirmPassword ตาม server schema
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      })
      if (result.error) {
        // แสดง message จาก server ให้ user เห็นโดยตรง (เช่น "รหัสผ่านปัจจุบันไม่ถูกต้อง")
        toast.error(result.error)
        return
      }
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      passwordForm.reset()
    } catch {
      toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

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
      {/* 1. PAGE HEADER */}
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
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* PROFILE SECTION */}
          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                Profile Information
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                This is how other members of your team will see you.
              </p>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
              <div className="p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 gap-5 max-w-md">
                  <Input
                    label="Display Name"
                    placeholder="Enter your full name"
                    {...profileForm.register('name')}
                    error={profileForm.formState.errors.name?.message}
                    hint="Your real name or alias."
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    {...profileForm.register('email')}
                    error={profileForm.formState.errors.email?.message}
                  />
                </div>
              </div>
              <div className="px-4 py-4 sm:px-5 bg-[var(--color-surface-low)] border-t border-[var(--color-border)] flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    profileForm.reset({ name: user.name, email: user.email })
                  }}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={profileForm.formState.isSubmitting}
                  disabled={profileForm.formState.isSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </section>

          {/* SECURITY SECTION */}
          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                Security & Authentication
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                Keep your account secure by using a strong, unique password.
              </p>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
              <div className="p-4 sm:p-5 space-y-6">
                <div className="max-w-md space-y-5">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />

                  <div className="grid grid-cols-1 gap-5 pt-4 border-t border-[var(--color-border)] border-dashed">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Min 6 characters"
                      {...passwordForm.register('password')}
                      error={passwordForm.formState.errors.password?.message}
                      hint="Must contain letters, numbers, and symbols."
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      {...passwordForm.register('confirmPassword')}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-5 bg-[var(--color-surface-low)] border-t border-[var(--color-border)] flex items-center justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={passwordForm.formState.isSubmitting}
                  disabled={passwordForm.formState.isSubmitting}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </section>

          {/* DANGER ZONE */}
          <section className="p-4 sm:p-5 border border-[var(--color-error)]/20 rounded-[var(--radius-md)] bg-[var(--color-error)]/5">
            <h2 className="text-sm font-bold mb-1 text-[var(--color-error)]">Danger Zone</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger" size="md">
              Delete Account
            </Button>
          </section>
        </div>

        {/* RIGHT COLUMN */}
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
