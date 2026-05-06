import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export const metadata: Metadata = {
  title: {
    template: '%s - Next.js Starter',
    default: 'Sign In - Next.js Starter',
  },
  description: 'Sign in to your account to access the dashboard and manage your workspace.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  openGraph: {
    title: 'Sign In - Next.js Starter',
    description: 'Sign in to your account',
    type: 'website',
  },
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('authLayout')
  const features = [
    { icon: 'bolt', text: t('featureAnalytics') },
    { icon: 'shield_lock', text: t('featureSecurity') },
    { icon: 'hub', text: t('featureTenant') },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg)]">
      <aside className="hidden lg:flex lg:w-[38%] xl:w-[34%] bg-[var(--color-surface-low)] border-r border-[var(--color-border)] flex-col justify-between p-10 relative overflow-hidden">
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

        <div className="relative z-10 max-w-md">
          <h2
            className="text-3xl font-black mb-4 leading-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('headline')}
          </h2>
          <p
            className="text-lg font-medium leading-relaxed opacity-60"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('description')}
          </p>

          <div className="mt-8 space-y-4">
            {features.map((item) => (
              <div key={item.icon} className="flex items-center gap-4 group">
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

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase opacity-40">{t('copyright')}</p>
          <div className="flex gap-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-20" />
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-40" />
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 relative bg-[var(--color-surface)]">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <LanguageSwitcher compact />
        </div>

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
