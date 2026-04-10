'use client'

import { useCallback } from 'react'
import { clsx } from 'clsx'
import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from '@/i18n/config'

// ────────────────────────────────────────
// LanguageSwitcher — คอมโพเนนต์สลับภาษา
// ใช้ cookie เก็บ locale แล้ว reload เพื่อให้ next-intl อ่านค่าใหม่
// ────────────────────────────────────────

interface LanguageSwitcherProps {
  /** locale ปัจจุบันจาก server */
  current_locale?: string
  /** CSS class เพิ่มเติม */
  className?: string
}

export function LanguageSwitcher({ current_locale, className }: LanguageSwitcherProps) {
  // เปลี่ยนภาษาโดยตั้ง cookie แล้ว reload
  const HandleChange = useCallback((locale: SupportedLocale) => {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
    window.location.reload()
  }, [])

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => HandleChange(locale)}
          className={clsx(
            'px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors',
            locale === current_locale
              ? 'bg-white text-black'
              : 'text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600'
          )}
          aria-label={`Switch to ${LOCALE_LABELS[locale]}`}
          aria-current={locale === current_locale ? 'true' : undefined}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
