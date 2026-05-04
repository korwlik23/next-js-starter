import type { Metadata } from 'next'

// ────────────────────────────────────────
// Auth Layout — ครอบหน้า login, register, forgot-password
// ใช้เป็น nested layout (ไม่สร้าง html/body ซ้ำ)
// robots: noindex — ไม่ต้องการให้ Google index หน้า auth
// ────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: '%s — Next.js Starter',
    default: 'Sign In — Next.js Starter',
  },
  description: 'Sign in to your account to access the dashboard and manage your workspace.',
  // ไม่ให้ Search Engine index หน้า auth (ข้อมูล sensitive + ไม่มีประโยชน์ต่อ SEO)
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  openGraph: {
    title: 'Sign In — Next.js Starter',
    description: 'Sign in to your account',
    type: 'website',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg)]">
      {/* 1. VISUAL SIDEBAR — Only visible on LG+ */}
      <aside className="hidden lg:flex lg:w-[38%] xl:w-[34%] bg-[var(--color-surface-low)] border-r border-[var(--color-border)] flex-col justify-between p-10 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] shadow-sm">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <span
            className="text-base font-black uppercase"
            style={{ color: 'var(--color-primary)' }}
          >
            Digital Gallery
          </span>
        </div>

        {/* Focal Point Message */}
        <div className="relative z-10 max-w-md">
          <h2
            className="text-3xl font-black mb-4 leading-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Empower your editorial workflow.
          </h2>
          <p
            className="text-lg font-medium leading-relaxed opacity-60"
            style={{ color: 'var(--color-text-muted)' }}
          >
            The production-grade platform for modern content creators and digital agencies.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: 'bolt', text: 'Real-time analytics and insights' },
              { icon: 'shield_lock', text: 'Enterprise-grade security and audit logs' },
              { icon: 'hub', text: 'Multi-tenant resource management' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-dim)] flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="text-sm font-bold tracking-tight opacity-70">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase opacity-40">
            © 2026 Digital Gallery Suite
          </p>
          <div className="flex gap-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-20" />
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-40" />
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          </div>
        </div>
      </aside>

      {/* 2. FORM AREA — Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 relative bg-[var(--color-surface)]">
        {/* Mobile Header (Hidden on LG) */}
        <div className="lg:hidden mb-8 flex w-full max-w-[420px] items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">
            auto_awesome
          </span>
          <span className="text-sm font-black uppercase">Digital Gallery</span>
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in duration-500">{children}</div>
      </main>
    </div>
  )
}
