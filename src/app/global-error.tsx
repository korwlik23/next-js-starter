'use client'

import '@/app/globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="th" suppressHydrationWarning>
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
            <h1 className="text-3xl font-extrabold text-white mb-4">เกิดข้อผิดพลาดร้ายแรง (500)</h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-8">
              พบปัญหา Internal Server Error ของระบบ ไม่สามารถประมวลผลคำขอนี้ได้ในขณะนี้
            </p>
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
              รีโหลดหน้าเว็บอีกครั้ง
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
