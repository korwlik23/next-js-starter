'use client'

import { useTranslations } from 'next-intl'

export default function Loading() {
  const t = useTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <span
          className="material-symbols-outlined animate-spin text-4xl"
          style={{ color: 'var(--color-text-faint)' }}
        >
          progress_activity
        </span>
        <p className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          {t('loading')}
        </p>
      </div>
    </div>
  )
}
