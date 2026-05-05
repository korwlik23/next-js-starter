'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'

// ────────────────────────────────────────
// 500 Internal Server Error Page
// Design: minimal editorial, consistent กับ 404 page
// ────────────────────────────────────────

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 relative z-10">
        <h1 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
          Gallery CMS
        </h1>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          Error Protocol 500
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center">
        <h2
          className="text-7xl sm:text-9xl md:text-[10rem] font-extrabold leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          500
        </h2>

        <p className="text-base mb-6 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
          Something went wrong on our end. Please try again later.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link href="/dashboard" className="btn-primary">
            Return to Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>

      {/* Background watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: 'min(60vw, 40rem)',
          fontWeight: 900,
          letterSpacing: 0,
          color: 'var(--color-surface-mid)',
          opacity: 0.25,
          lineHeight: 1,
        }}
      >
        500
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 relative z-10">
        <div className="flex flex-wrap gap-3 sm:gap-6">
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Status: Internal Error
          </span>
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Reference: 0x1F500
          </span>
        </div>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          © Editorial Archive Team
        </span>
      </footer>
    </div>
  )
}
