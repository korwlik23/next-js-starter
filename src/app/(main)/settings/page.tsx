'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/apiClient'
import toast from 'react-hot-toast'
import { Skeleton, Input, Button } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ProfileFormValues = {
  name: string
  email: string
}

type PasswordFormValues = {
  currentPassword: string
  password: string
  confirmPassword: string
}

type AuthDetails = {
  id: string
  name: string
  email: string
  roles: string[]
  permissions?: string[]
  emailVerifiedAt: string | null
  mfaEnabled: boolean
}

type MfaSetupState = {
  secret: string
  otpauthUrl: string
}

export default function SettingsPage() {
  const t = useTranslations('settingsPage')
  const tCommon = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [authDetails, setAuthDetails] = useState<AuthDetails | null>(null)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [isStartingMfa, setIsStartingMfa] = useState(false)
  const [isConfirmingMfa, setIsConfirmingMfa] = useState(false)
  const [isDisablingMfa, setIsDisablingMfa] = useState(false)
  const [mfaSetup, setMfaSetup] = useState<MfaSetupState | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaDisableCode, setMfaDisableCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('nameRequired')),
        email: z.string().email(t('invalidEmail')),
      }),
    [t]
  )

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('currentPasswordRequired')),
          password: z.string().min(6, t('passwordMin')),
          confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  const loadAuthDetails = useCallback(async () => {
    const result = await api.get<AuthDetails>('/api/auth/me')
    if (!result.error && result.data) {
      setAuthDetails(result.data)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      })
      void loadAuthDetails()
    }
  }, [user, profileForm, loadAuthDetails])

  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!user) return
    try {
      const result = await api.patch(`/api/user/${user.id}`, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      const nextUser = { ...user, name: data.name, email: data.email }
      setUser(nextUser)
      setAuthDetails((current) =>
        current ? { ...current, name: data.name, email: data.email } : current
      )
      toast.success(t('profileSaveSuccess'))
    } catch {
      toast.error(t('profileSaveError'))
    }
  }

  const onSubmitPassword = async (data: PasswordFormValues) => {
    if (!user) return
    try {
      const result = await api.patch(`/api/user/${user.id}`, {
        currentPassword: data.currentPassword,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('passwordSaveSuccess'))
      passwordForm.reset()
    } catch {
      toast.error(t('passwordSaveError'))
    }
  }

  const handleResendVerification = async () => {
    setIsSendingVerification(true)
    try {
      const result = await api.post<{ sent: boolean; alreadyVerified: boolean }>(
        '/api/auth/verify-email/resend',
        {}
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.alreadyVerified) {
        await loadAuthDetails()
        toast.success('Email is already verified')
        return
      }

      toast.success('Verification email sent')
    } catch {
      toast.error('Unable to send verification email')
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleStartMfa = async () => {
    setIsStartingMfa(true)
    setRecoveryCodes([])
    try {
      const result = await api.post<MfaSetupState>('/api/auth/mfa/setup', {})
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Unable to start MFA setup')
        return
      }

      setMfaSetup(result.data)
      setMfaCode('')
    } catch {
      toast.error('Unable to start MFA setup')
    } finally {
      setIsStartingMfa(false)
    }
  }

  const handleConfirmMfa = async () => {
    if (!mfaCode.trim()) {
      toast.error('Authentication code is required')
      return
    }

    setIsConfirmingMfa(true)
    try {
      const result = await api.post<{ enabled: boolean; recoveryCodes: string[] }>(
        '/api/auth/mfa/confirm',
        { code: mfaCode.trim() }
      )

      if (result.error || !result.data) {
        toast.error(result.error ?? 'Unable to enable MFA')
        return
      }

      setMfaSetup(null)
      setMfaCode('')
      setRecoveryCodes(result.data.recoveryCodes)
      setAuthDetails((current) => (current ? { ...current, mfaEnabled: true } : current))
      setUser(user ? { ...user, mfaEnabled: true } : user)
      toast.success('MFA enabled')
    } catch {
      toast.error('Unable to enable MFA')
    } finally {
      setIsConfirmingMfa(false)
    }
  }

  const handleDisableMfa = async () => {
    if (!mfaDisableCode.trim()) {
      toast.error('Authentication code is required')
      return
    }

    setIsDisablingMfa(true)
    try {
      const result = await api.post<{ enabled: boolean }>('/api/auth/mfa/disable', {
        code: mfaDisableCode.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setMfaDisableCode('')
      setRecoveryCodes([])
      setAuthDetails((current) => (current ? { ...current, mfaEnabled: false } : current))
      setUser(user ? { ...user, mfaEnabled: false } : user)
      toast.success('MFA disabled')
    } catch {
      toast.error('Unable to disable MFA')
    } finally {
      setIsDisablingMfa(false)
    }
  }

  if (!mounted || !user) {
    return (
      <div>
        <Skeleton width="300px" height="2.5rem" className="mb-4" />
        <Skeleton width="100%" height="20rem" border_radius="0.75rem" />
      </div>
    )
  }

  const emailVerifiedAt = authDetails?.emailVerifiedAt ?? user.emailVerifiedAt ?? null
  const mfaEnabled = authDetails?.mfaEnabled ?? user.mfaEnabled ?? false

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
      <header className="mb-6 pt-2">
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          {t('description')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                {t('profileInformation')}
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                {t('profileDescription')}
              </p>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
              <div className="p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 gap-5 max-w-md">
                  <Input
                    label={t('displayName')}
                    placeholder={t('displayNamePlaceholder')}
                    {...profileForm.register('name')}
                    error={profileForm.formState.errors.name?.message}
                    hint={t('displayNameHint')}
                  />
                  <Input
                    label={t('emailAddress')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
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
                  {t('discard')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={profileForm.formState.isSubmitting}
                  disabled={profileForm.formState.isSubmitting}
                >
                  {tCommon('save')}
                </Button>
              </div>
            </form>
          </section>

          <section className="editorial-card-elevated overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                {t('securityAuthentication')}
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                {t('securityDescription')}
              </p>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
              <div className="p-4 sm:p-5 space-y-6">
                <div className="max-w-md space-y-5">
                  <Input
                    label={t('currentPassword')}
                    type="password"
                    placeholder="********"
                    {...passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />

                  <div className="grid grid-cols-1 gap-5 pt-4 border-t border-[var(--color-border)] border-dashed">
                    <Input
                      label={t('newPassword')}
                      type="password"
                      placeholder={t('newPasswordPlaceholder')}
                      {...passwordForm.register('password')}
                      error={passwordForm.formState.errors.password?.message}
                      hint={t('newPasswordHint')}
                    />
                    <Input
                      label={t('confirmNewPassword')}
                      type="password"
                      placeholder="********"
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
                  {t('updatePassword')}
                </Button>
              </div>
            </form>

            <div className="p-4 sm:p-5 border-t border-[var(--color-border)] space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    Email verification
                  </h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                    {emailVerifiedAt
                      ? `Verified ${new Date(emailVerifiedAt).toLocaleDateString()}`
                      : 'Verification is pending for this account.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={emailVerifiedAt ? 'outline' : 'secondary'}
                  isLoading={isSendingVerification}
                  disabled={Boolean(emailVerifiedAt) || isSendingVerification}
                  onClick={handleResendVerification}
                >
                  {emailVerifiedAt ? 'Verified' : 'Resend email'}
                </Button>
              </div>

              <div className="pt-6 border-t border-[var(--color-border)] border-dashed space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      Multi-factor authentication
                    </h3>
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-text-subtle)' }}
                    >
                      {mfaEnabled ? 'Enabled for this account.' : 'Not enabled for this account.'}
                    </p>
                  </div>

                  {!mfaEnabled && !mfaSetup && (
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={isStartingMfa}
                      disabled={isStartingMfa}
                      onClick={handleStartMfa}
                    >
                      Enable MFA
                    </Button>
                  )}
                </div>

                {mfaSetup && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span
                          className="block text-[10px] font-black uppercase mb-2"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          Authenticator secret
                        </span>
                        <code className="block text-xs font-mono break-all p-3 bg-[var(--color-surface-low)] rounded-md border border-[var(--color-border)]">
                          {mfaSetup.secret}
                        </code>
                      </div>
                      <div>
                        <span
                          className="block text-[10px] font-black uppercase mb-2"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          OTP auth URI
                        </span>
                        <code className="block text-xs font-mono break-all p-3 bg-[var(--color-surface-low)] rounded-md border border-[var(--color-border)]">
                          {mfaSetup.otpauthUrl}
                        </code>
                      </div>
                    </div>
                    <div className="max-w-sm space-y-3">
                      <Input
                        id="mfa-confirm-code"
                        label="Current code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(event) => setMfaCode(event.target.value)}
                      />
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setMfaSetup(null)
                            setMfaCode('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          isLoading={isConfirmingMfa}
                          disabled={isConfirmingMfa}
                          onClick={handleConfirmMfa}
                        >
                          Confirm MFA
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {mfaEnabled && (
                  <div className="max-w-sm space-y-3">
                    <Input
                      id="mfa-disable-code"
                      label="Current code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={mfaDisableCode}
                      onChange={(event) => setMfaDisableCode(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      isLoading={isDisablingMfa}
                      disabled={isDisablingMfa}
                      onClick={handleDisableMfa}
                    >
                      Disable MFA
                    </Button>
                  </div>
                )}

                {recoveryCodes.length > 0 && (
                  <div className="space-y-3">
                    <h4
                      className="text-[10px] font-black uppercase"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      Recovery codes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recoveryCodes.map((code) => (
                        <code
                          key={code}
                          className="text-xs font-mono p-3 bg-[var(--color-surface-low)] rounded-md border border-[var(--color-border)]"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-5 border border-[var(--color-error)]/20 rounded-[var(--radius-md)] bg-[var(--color-error)]/5">
            <h2 className="text-sm font-bold mb-1 text-[var(--color-error)]">{t('dangerZone')}</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              {t('dangerDescription')}
            </p>
            <Button variant="danger" size="md">
              {t('deleteAccount')}
            </Button>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <section className="editorial-card-elevated p-4 sm:p-5 shadow-sm">
            <h3
              className="text-[10px] font-black uppercase mb-5"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {t('accountDetails')}
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  {t('memberRole')}
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
                  {t('userIdentifier')}
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
              {t('quickLinks')}
            </h3>
            <div className="flex flex-col gap-4">
              <Link
                href="/billing"
                className="text-sm font-bold flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="material-symbols-outlined text-base">payments</span>
                {t('billingPortal')}
              </Link>
              <Link
                href="/settings/team"
                className="text-sm font-bold flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="material-symbols-outlined text-base">group</span>
                {t('manageTeam')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
