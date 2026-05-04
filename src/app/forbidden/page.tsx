import Link from 'next/link'

// ────────────────────────────────────────
// 403 Forbidden — หน้าแจ้งสิทธิ์ไม่เพียงพอ
// Design เดียวกับ 404 แต่แสดง 403
// ────────────────────────────────────────

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 relative z-10">
        <h1 className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
          Gallery CMS
        </h1>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          Error Protocol 403
        </span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center">
        <h2
          className="text-7xl sm:text-9xl md:text-[10rem] font-extrabold leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          403
        </h2>
        <p className="text-base mb-6 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link href="/dashboard" className="btn-primary">
            กลับสู่หน้าหลัก
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          <Link href="/login" className="btn-secondary">
            เข้าสู่ระบบใหม่
          </Link>
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
        403
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 relative z-10">
        <div className="flex flex-wrap gap-3 sm:gap-6">
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Status: Forbidden
          </span>
          <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
            Access: Denied
          </span>
        </div>
        <span className="label-xs" style={{ color: 'var(--color-text-faint)' }}>
          © Editorial Archive Team
        </span>
      </footer>
    </div>
  )
}
