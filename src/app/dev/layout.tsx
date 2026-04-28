import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Dev UI' }

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <div className="dev-layout-wrapper">
      <style>{`
        .dev-layout-wrapper { background: #050505; color: #e2e2e2; font-family: 'Inter', sans-serif; min-height: 100vh; }
        .editorial-input { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 0.75rem 0; color: #e2e2e2; font-size: 0.875rem; transition: border-color 150ms; }
        .editorial-input:focus { outline: none; border-bottom: 2px solid white; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24; vertical-align: middle; }
        .dev-link { display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #888; font-size: 13px; text-decoration: none; border-radius: 2px; transition: all 150ms; }
        .dev-link:hover { color: white; background: #111; }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '200px',
            borderRight: '1px solid #1a1a1a',
            padding: '2rem 1.5rem',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#666',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            Dev Tools
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { href: '/dev/ui', label: 'UI Components', icon: 'palette' },
              { href: '/dev/test-api', label: 'Test API', icon: 'api' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="dev-link">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {item.icon}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  )
}
