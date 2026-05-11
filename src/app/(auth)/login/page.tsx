'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLoginSchema, type LoginInput } from '@/modules/auth/schema'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

type MfaChallengeState = {
  challengeId: string
  expiresAt: string
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const setUser = useAuthStore((s) => s.setUser)
  const [server_error, setServerError] = useState('')
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false)
  const loginSchema = useMemo(
    () =>
      createLoginSchema({
        invalidEmail: tValidation('invalidEmail'),
        nameMin: tValidation('nameMin'),
        passwordMin6: tValidation('passwordMin6'),
        passwordMin8: tValidation('passwordMin8'),
        passwordMismatch: tValidation('passwordMismatch'),
        tokenRequired: tValidation('tokenRequired'),
        refreshTokenRequired: tValidation('refreshTokenRequired'),
      }),
    [tValidation]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('email') || params.has('password')) {
      window.history.replaceState(null, '', '/login')
    }
  }, [])

  async function HandleSubmit(data: LoginInput) {
    setServerError('')
    setMfaCode('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        const error_msg = json.message ?? t('errors.server')
        setServerError(error_msg)
        toast.error(error_msg)
        return
      }

      if (json.data?.mfaRequired) {
        setMfaChallenge({
          challengeId: json.data.challengeId,
          expiresAt: json.data.expiresAt,
        })
        toast.success('Enter your authentication code')
        return
      }

      setUser(json.data.user)
      toast.success(t('successLogin'))
      router.replace('/dashboard')
      router.refresh()
      window.location.assign('/dashboard')
    } catch {
      setServerError(t('errors.network'))
      toast.error(t('errors.network'))
    }
  }

  async function HandleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mfaChallenge) return

    setServerError('')
    setIsVerifyingMfa(true)

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: mfaChallenge.challengeId,
          code: mfaCode.trim(),
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        const error_msg = json.message ?? t('errors.server')
        setServerError(error_msg)
        toast.error(error_msg)
        return
      }

      setUser(json.data.user)
      toast.success(t('successLogin'))
      router.replace('/dashboard')
      router.refresh()
      window.location.assign('/dashboard')
    } catch {
      setServerError(t('errors.network'))
      toast.error(t('errors.network'))
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-black mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('welcomeBack')}
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {t('loginSubtitle')}
        </p>
      </header>

      {mfaChallenge ? (
        <form onSubmit={HandleMfaSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label
              className="text-[10px] font-black uppercase"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor="mfa-code"
            >
              Authentication code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="123456 or recovery code"
              className="editorial-input w-full shadow-sm"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
              required
            />
            <p className="text-[10px] font-bold" style={{ color: 'var(--color-text-subtle)' }}>
              Expires at {new Date(mfaChallenge.expiresAt).toLocaleTimeString()}
            </p>
          </div>

          {server_error && (
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-black uppercase flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">error</span>
              {server_error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isVerifyingMfa || !mfaCode.trim()}
              className="btn-primary w-full text-[10px] font-black uppercase shadow-sm flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isVerifyingMfa ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                  Verifying
                </>
              ) : (
                <>
                  Continue
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                    arrow_right_alt
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              className="w-full text-[10px] font-black uppercase hover:text-[var(--color-primary)] transition-colors"
              style={{ color: 'var(--color-text-faint)' }}
              onClick={() => {
                setMfaChallenge(null)
                setMfaCode('')
                setServerError('')
              }}
            >
              Use another account
            </button>
          </div>
        </form>
      ) : (
        <form
          method="post"
          action="/api/auth/login"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit(HandleSubmit)(event)
          }}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-2">
            <label
              className="text-[10px] font-black uppercase"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor="email"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('companyEmailPlaceholder')}
              className="editorial-input w-full shadow-sm"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label
                className="text-[10px] font-black uppercase"
                style={{ color: 'var(--color-text-subtle)' }}
                htmlFor="password"
              >
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] font-black uppercase hover:text-[var(--color-primary)] transition-colors"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              className="editorial-input w-full shadow-sm"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {server_error && (
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-black uppercase flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">error</span>
              {server_error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-[10px] font-black uppercase shadow-sm flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                  {t('authenticating')}
                </>
              ) : (
                <>
                  {t('signInToWorkspace')}
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                    arrow_right_alt
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="mt-10">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)] opacity-50" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase">
            <span
              className="bg-[var(--color-surface)] px-4"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/login`}
            className="flex min-h-11 items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase">Google</span>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/login`}
            className="flex min-h-11 items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase">GitHub</span>
          </a>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t border-[var(--color-border)]/50 text-center">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-black text-[var(--color-primary)] hover:underline underline-offset-4 transition-all"
          >
            {t('createWorkspace')}
          </Link>
        </p>
      </footer>
    </div>
  )
}
