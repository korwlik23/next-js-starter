'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createForgotPasswordSchema, type ForgotPasswordInput } from '@/modules/auth/schema'
import { api } from '@/services/apiClient'
import { toast } from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword')
  const tAuthErrors = useTranslations('auth.errors')
  const tValidation = useTranslations('validation')
  const [isSent, setIsSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const schema = useMemo(
    () =>
      createForgotPasswordSchema({
        invalidEmail: tValidation('invalidEmail'),
      }),
    [tValidation]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(schema) })

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      const res = await api.post('/api/auth/forgot-password', data)
      if (res.error) {
        toast.error(res.error)
      } else {
        setSentEmail(data.email)
        setIsSent(true)
      }
    } catch {
      toast.error(tAuthErrors('server'))
    }
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ color: 'var(--color-primary)' }}
          >
            lock_reset
          </span>
        </div>
        <h1
          className="font-extrabold text-2xl uppercase mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h1>
        <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-subtle)' }}>
          {t('subtitle')}
        </p>
      </div>

      <div className="w-full p-4 sm:p-6 editorial-card-elevated">
        {isSent ? (
          <div className="text-center py-4">
            <span
              className="material-symbols-outlined text-5xl mb-4 block"
              style={{ color: 'var(--color-success)' }}
            >
              mark_email_read
            </span>
            <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--color-primary)' }}>
              {t('sentTitle')}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-subtle)' }}>
              {t('sentDescription')}
              <br />
              <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {sentEmail}
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {t('spamHint')}
            </p>
          </div>
        ) : (
          <>
            <header className="mb-6">
              <h2
                className="font-bold text-xl tracking-tight mb-2"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('resetTitle')}
              </h2>
              <p style={{ color: 'var(--color-text-subtle)' }} className="text-sm">
                {t('resetDescription')}
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label
                  className="label-xs block mb-1"
                  style={{ color: 'var(--color-text-subtle)' }}
                  htmlFor="fp-email"
                >
                  {t('emailLabel')}
                </label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  className="editorial-input w-full"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full text-xs group disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">
                        progress_activity
                      </span>
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      {t('sendLink')}
                      <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                        arrow_right_alt
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <footer className="mt-12 text-center">
        <Link
          href="/login"
          className="text-xs transition-colors hover:opacity-70 flex items-center gap-1 justify-center"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t('backToSignIn')}
        </Link>
      </footer>
    </div>
  )
}
