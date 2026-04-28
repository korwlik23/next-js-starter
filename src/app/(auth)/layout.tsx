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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-surface)]">
      {/* 1. VISUAL SIDEBAR — Only visible on LG+ */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-[var(--color-surface-low)] border-r border-[var(--color-border)] flex-col justify-between p-16 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-[0.03]">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[var(--color-primary)] blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--color-primary)] blur-[100px]" />
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
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary)]/20">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <span
            className="text-xl font-black tracking-tighter uppercase"
            style={{ color: 'var(--color-primary)' }}
          >
            Digital Gallery
          </span>
        </div>

        {/* Focal Point Message */}
        <div className="relative z-10 max-w-md">
          <h2
            className="text-5xl font-black tracking-tighter mb-6 leading-[0.95]"
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

          <div className="mt-12 space-y-6">
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
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
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
      <main className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 md:p-20 relative bg-[var(--color-surface)]">
        {/* Mobile Header (Hidden on LG) */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">
            auto_awesome
          </span>
          <span className="text-sm font-black tracking-tighter uppercase">Digital Gallery</span>
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}
