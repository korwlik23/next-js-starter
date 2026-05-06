import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function HomePage() {
  const showDevTools = process.env.NODE_ENV === 'development'
  const t = await getTranslations('home')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
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
          {t('eyebrow')}
        </p>
        <h1
          className="text-5xl font-extrabold tracking-tighter mb-4"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h1>
        <p
          className="text-sm max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          {t('goDashboard')}
        </Link>
        <Link href="/login" className="btn-secondary">
          {t('signIn')}
        </Link>
        {showDevTools ? (
          <Link
            href="/dev/ui"
            className="btn-secondary"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-subtle)' }}
          >
            {t('uiComponents')}
          </Link>
        ) : null}
      </div>

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
