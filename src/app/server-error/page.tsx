import Link from 'next/link'

// ────────────────────────────────────────
// 500 Internal Server Error Page
// Design: minimal editorial, consistent กับ 404 page
// ────────────────────────────────────────

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-8 relative z-10">
        <h1
          className="text-lg font-bold tracking-tighter"
          style={{ color: 'var(--color-primary)' }}
        >
          Gallery CMS
        </h1>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          Error Protocol 500
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <h2
          className="text-[12rem] sm:text-[16rem] font-extrabold tracking-tighter leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          500
        </h2>

        <p className="text-lg mb-12" style={{ color: 'var(--color-text-muted)' }}>
          Something went wrong on our end. Please try again later.
        </p>

        <div className="flex gap-4">
          <Link href="/dashboard" className="btn-primary">
            Return to Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          <button onClick={() => window.location.reload()} className="btn-secondary">
            Try Again
          </button>
        </div>
      </div>

      {/* Background watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: 'min(60vw, 40rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'var(--color-surface-mid)',
          opacity: 0.5,
          lineHeight: 1,
        }}
      >
        500
      </div>

      {/* Footer */}
      <footer className="flex justify-between items-center p-8 relative z-10">
        <div className="flex gap-6">
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
