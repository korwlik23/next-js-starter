'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errorPage')

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg, #f9f9f9)', color: 'var(--color-text, #1b1b1b)' }}
    >
      <header className="flex justify-between items-center p-8 relative z-10">
        <h1 className="text-lg font-bold tracking-tighter">Gallery CMS</h1>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: '#777' }}
        >
          {t('protocol500')}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-6">
        <h2 className="text-[8rem] sm:text-[16rem] font-extrabold tracking-tighter leading-none">
          500
        </h2>
        <p className="text-lg mb-2" style={{ color: '#474747' }}>
          {t('message500')}
        </p>
        {error.digest && (
          <p className="text-[10px] mb-12" style={{ color: '#a3a3a3' }}>
            {t('errorId', { digest: error.digest })}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-[0.1em] py-3 px-6"
            style={{
              backgroundColor: '#000',
              color: '#e2e2e2',
              borderRadius: '0.125rem',
            }}
          >
            {t('tryAgain')}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-[0.1em] py-3 px-6"
            style={{
              border: '1px solid rgba(198,198,198,0.4)',
              borderRadius: '0.125rem',
            }}
          >
            {t('goHome')}
          </Link>
        </div>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: 'min(60vw, 40rem)',
          fontWeight: 900,
          letterSpacing: 0,
          color: '#eee',
          opacity: 0.5,
          lineHeight: 1,
        }}
      >
        500
      </div>

      <footer className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-8 relative z-10">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: '#a3a3a3' }}
        >
          {t('statusServerError')}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: '#a3a3a3' }}
        >
          {t('copyright')}
        </span>
      </footer>
    </div>
  )
}
