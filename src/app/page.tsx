import Link from 'next/link'

// ────────────────────────────────────────
// Home Page — Landing page สำหรับ Next.js Starter
// ใช้ editorial design: minimal, high-contrast, architectural
// ────────────────────────────────────────

export default function HomePage() {
  const showDevTools = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      {/* Brand — icon + ชื่อแอป + tagline */}
      <div className="mb-16">
        <div
          className="inline-flex items-center justify-center mb-6 w-16 h-16 border"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          <span
            className="material-symbols-outlined text-3xl"
            style={{ color: 'var(--color-primary)' }}
          >
            rocket_launch
          </span>
        </div>
        <p
          className="text-[0.6rem] uppercase tracking-[0.3em] font-bold mb-2"
          style={{ color: 'var(--color-text-faint)' }}
        >
          Ultimate Starter
        </p>
        <h1
          className="text-5xl font-extrabold tracking-tighter mb-4"
          style={{ color: 'var(--color-primary)' }}
        >
          Next.js Starter
        </h1>
        <p
          className="text-sm max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          Fullstack Production-Ready Template — Auth, RBAC, Multi-tenant, SaaS-ready
        </p>
      </div>

      {/* CTA Buttons — editorial button styles */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
        <Link href="/login" className="btn-secondary">
          Sign In
        </Link>
        {showDevTools ? (
          <Link
            href="/dev/ui"
            className="btn-secondary"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-subtle)' }}
          >
            UI Components
          </Link>
        ) : null}
      </div>

      {/* Tech Stack — แสดง technologies ที่ใช้ */}
      <div className="mt-20 grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-lg text-center">
        {['Next.js 16', 'React 19', 'TypeScript', 'Prisma', 'Tailwind v4', 'Zustand'].map(
          (tech) => (
            <div
              key={tech}
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {tech}
            </div>
          )
        )}
      </div>
    </div>
  )
}
