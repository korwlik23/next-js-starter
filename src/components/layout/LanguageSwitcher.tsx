'use client'

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/config'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const currentLocale = useLocale()
  const t = useTranslations('language')

  const handleChange = useCallback((locale: SupportedLocale) => {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    window.location.reload()
  }, [])

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] p-1',
        className
      )}
      aria-label={t('label')}
      role="group"
    >
      {!compact && (
        <span className="hidden px-2 text-[10px] font-black uppercase text-[var(--color-text-faint)] sm:inline">
          {t('label')}
        </span>
      )}
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale
        return (
          <button
            key={locale}
            onClick={() => handleChange(locale)}
            className={clsx(
              'min-h-8 min-w-9 rounded-[var(--radius-sm)] px-2 text-[10px] font-black uppercase transition-colors',
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            )}
            aria-label={t('switchTo', { locale: t(locale) })}
            aria-pressed={isActive}
            type="button"
          >
            {locale}
          </button>
        )
      })}
    </div>
  )
}
