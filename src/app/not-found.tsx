import Link from 'next/link'

// ────────────────────────────────────────
// 404 Not Found — ตาม editorial template "404_error_page"
// Design: watermark "404", editorial minimal, 2 CTA buttons
// ────────────────────────────────────────

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header — brand + error label */}
      <header className="flex justify-between items-center p-4 sm:p-6 relative z-10">
        <h1 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
          Gallery CMS
        </h1>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          Error Protocol 404
        </span>
      </header>

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center">
        {/* ตัวเลข 404 ขนาดใหญ่ */}
        <h2
          className="text-7xl sm:text-9xl md:text-[10rem] font-extrabold leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          404
        </h2>

        {/* คำอธิบาย */}
        <p className="text-base mb-6 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
          The content you seek has drifted into the void.
        </p>

        {/* Action buttons */}
        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link href="/dashboard" className="btn-primary">
            Return to Dashboard
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          <Link href="/" className="btn-secondary">
            Report Issue
          </Link>
        </div>
      </div>

      {/* Background watermark 404 — ขนาดใหญ่มากเป็น background */}
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
        404
      </div>

      {/* Footer — status info */}
      <footer className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 relative z-10">
        <div className="flex flex-wrap gap-3 sm:gap-6">
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Status: Lost
          </span>
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Reference: 0xFD33
          </span>
        </div>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          © Editorial Archive Team
        </span>
      </footer>
    </div>
  )
}
