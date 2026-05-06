'use client'

import { useMemo } from 'react'
import '@/app/globals.css'
import enMessages from '../../messages/en.json'
import thMessages from '../../messages/th.json'

const messages = {
  en: enMessages.errorPage,
  th: thMessages.errorPage,
}

function getClientLocale() {
  if (typeof document === 'undefined') {
    return 'th'
  }

  const locale = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('locale='))
    ?.split('=')[1]

  return locale === 'en' ? 'en' : 'th'
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useMemo(() => messages[getClientLocale()], [])

  return (
    <html lang={getClientLocale()} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=optional"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
          <div className="editorial-card-elevated max-w-lg w-full p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-6 block">
              error
            </span>
            <h1 className="text-3xl font-extrabold text-white mb-4">{t.criticalTitle}</h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-8">{t.criticalDescription}</p>
            {process.env.NODE_ENV === 'development' && (
              <div
                className="p-4 rounded-xl text-left mb-8 overflow-auto max-h-48 text-xs font-mono break-all"
                style={{
                  backgroundColor: 'var(--color-surface-low)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-subtle)',
                }}
              >
                {error.message}
              </div>
            )}
            <button onClick={() => reset()} className="btn-primary w-full py-3">
              {t.reload}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
