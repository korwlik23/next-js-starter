'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Input, Button } from '@/components/ui'
import { createResetPasswordSchema, type ResetPasswordInput } from '@/modules/auth/schema'
import { api } from '@/services/apiClient'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const t = useTranslations('resetPassword')
  const tValidation = useTranslations('validation')
  const [isLoading, setIsLoading] = useState(false)

  const schema = useMemo(
    () =>
      createResetPasswordSchema({
        tokenRequired: tValidation('tokenRequired'),
        passwordMin8: tValidation('passwordMin8'),
        passwordMismatch: tValidation('passwordMismatch'),
      }),
    [tValidation]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: token || '',
    },
  })

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          {t('invalidLinkTitle')}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {t('invalidLinkDescription')}
        </p>
        <Link
          href="/forgot-password"
          style={{ color: 'var(--color-primary)' }}
          className="text-sm font-semibold hover:underline"
        >
          {t('backToForgot')}
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/reset-password', data)
      if (response.error) {
        toast.error(response.error)
        return
      }

      toast.success(t('success'))
      router.push('/login')
    } catch {
      toast.error(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h1
        className="text-2xl sm:text-3xl font-extrabold text-center mb-4"
        style={{ color: 'var(--color-text)' }}
      >
        {t('title')}
      </h1>
      <p className="text-center mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {t('description')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('token')} />

        <Input
          label={t('newPassword')}
          type="password"
          placeholder={t('newPasswordPlaceholder')}
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <Input
          label={t('confirmPassword')}
          type="password"
          placeholder={t('confirmPasswordPlaceholder')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
          {t('submit')}
        </Button>

        <p className="text-center mt-6 text-sm">
          <Link
            href="/login"
            style={{ color: 'var(--color-text-muted)' }}
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            {t('backToLogin')}
          </Link>
        </p>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  const tCommon = useTranslations('common')

  return (
    <Suspense fallback={<div className="text-center">{tCommon('loading')}</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
