'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { SelectMenu } from '@/components/ui'

interface RuntimeLocale {
  code: string
  name: string
  nativeName: string
  enabled: boolean
}

interface RuntimeI18nConfig {
  settings: {
    langMode: 'switch' | 'multi'
  }
  locales: RuntimeLocale[]
  availableLocales: string[]
}

const FALLBACK_CONFIG: RuntimeI18nConfig = {
  settings: { langMode: 'switch' },
  locales: [
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
  ],
  availableLocales: ['th', 'en'],
}

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const currentLocale = useLocale()
  const t = useTranslations('language')
  const [config, setConfig] = useState<RuntimeI18nConfig>(FALLBACK_CONFIG)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      try {
        const response = await fetch('/api/i18n/config', { cache: 'no-store' })
        const json = await response.json()
        if (!cancelled && json?.data) {
          setConfig(json.data)
        }
      } catch {
        if (!cancelled) setConfig(FALLBACK_CONFIG)
      }
    }

    loadConfig()
    return () => {
      cancelled = true
    }
  }, [])

  const visibleLocales = useMemo(() => {
    const available = new Set(config.availableLocales)
    return config.locales.filter((locale) => locale.enabled && available.has(locale.code))
  }, [config])

  const handleChange = useCallback((locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    window.location.reload()
  }, [])

  if (config.settings.langMode === 'multi') {
    return (
      <div className={clsx('inline-flex items-center gap-2', className)}>
        {!compact && (
          <span className="hidden text-[10px] font-black uppercase text-[var(--color-text-faint)] sm:inline">
            {t('label')}
          </span>
        )}
        <SelectMenu
          value={currentLocale}
          onValueChange={handleChange}
          className="min-w-44"
          buttonClassName="h-9 text-xs font-black uppercase"
          aria-label={t('label')}
          options={visibleLocales.map((locale) => ({
            label: compact ? locale.code.toUpperCase() : `${locale.nativeName} (${locale.code})`,
            value: locale.code,
          }))}
        />
      </div>
    )
  }

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
      {visibleLocales.slice(0, 2).map((locale) => {
        const isActive = locale.code === currentLocale
        return (
          <button
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={clsx(
              'min-h-8 min-w-9 rounded-[var(--radius-sm)] px-2 text-[10px] font-black uppercase transition-colors',
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            )}
            aria-label={t('switchTo', { locale: locale.nativeName })}
            aria-pressed={isActive}
            type="button"
          >
            {locale.code}
          </button>
        )
      })}
    </div>
  )
}
