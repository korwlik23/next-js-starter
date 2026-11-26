import type { ReactNode } from 'react'

interface ShowcaseSectionProps {
  title: string
  children: ReactNode
}

export function ShowcaseSection({ title, children }: ShowcaseSectionProps) {
  return (
    <section className="mb-16">
      <h2
        className="mb-6 border-b pb-4 text-xs font-extrabold uppercase tracking-widest"
        style={{
          color: 'var(--color-text-subtle)',
          borderColor: 'var(--color-border)',
        }}
      >
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}
