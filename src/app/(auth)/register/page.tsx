'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRegisterSchema, type RegisterInput } from '@/modules/auth/schema'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const [server_error, setServerError] = useState('')
  const registerSchema = useMemo(
    () =>
      createRegisterSchema({
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
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function HandleSubmit(data: RegisterInput) {
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
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
      toast.success(t('successRegister'))
      router.push('/dashboard')
    } catch {
      setServerError(t('errors.network'))
      toast.error(t('errors.network'))
    }
  }

  const FORM_FIELDS = [
    {
      id: 'name',
      label: t('fullName'),
      type: 'text',
      placeholder: t('fullNamePlaceholder'),
      field: 'name' as const,
    },
    {
      id: 'reg-email',
      label: t('email'),
      type: 'email',
      placeholder: t('emailPlaceholder'),
      field: 'email' as const,
    },
    {
      id: 'reg-password',
      label: t('password'),
      type: 'password',
      placeholder: '********',
      field: 'password' as const,
    },
    {
      id: 'reg-confirm',
      label: t('confirmPassword'),
      type: 'password',
      placeholder: '********',
      field: 'confirmPassword' as const,
    },
  ]

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-black mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('createAccount')}
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {t('registerSubtitle')}
        </p>
      </header>

      <form
        onSubmit={handleSubmit(HandleSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        noValidate
      >
        {FORM_FIELDS.map(({ id, label, type, placeholder, field }) => (
          <div key={id} className={field === 'name' || field === 'email' ? 'sm:col-span-2' : ''}>
            <label
              className="text-[10px] font-black uppercase mb-2 block"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor={id}
            >
              {label}
            </label>
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              className="editorial-input w-full shadow-sm"
              {...register(field)}
            />
            {errors[field] && (
              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                {errors[field]?.message}
              </p>
            )}
          </div>
        ))}

        {server_error && (
          <div className="sm:col-span-2 p-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-black uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">error</span>
            {server_error}
          </div>
        )}

        <div className="sm:col-span-2 pt-2">
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
                {t('creatingAccount')}
              </>
            ) : (
              <>
                {t('initializeWorkspace')}
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  rocket_launch
                </span>
              </>
            )}
          </button>
        </div>
      </form>

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
              {t('orRegisterWith')}
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
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-black text-[var(--color-primary)] hover:underline underline-offset-4 transition-all"
          >
            {t('login')}
          </Link>
        </p>
      </footer>
    </div>
  )
}
