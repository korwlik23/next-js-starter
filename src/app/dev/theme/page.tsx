'use client'

export default function ThemeDevPage() {
  const colors = [
    {
      name: 'Primary',
      var: '--color-primary',
      bg: 'bg-[var(--color-primary)]',
      text: 'text-[var(--color-on-primary)]',
    },
    {
      name: 'Secondary',
      var: '--color-secondary',
      bg: 'bg-[var(--color-secondary)]',
      text: 'text-[var(--color-on-secondary)]',
    },
    {
      name: 'Surface',
      var: '--color-surface',
      bg: 'bg-[var(--color-surface)]',
      text: 'text-[var(--color-text)]',
    },
    {
      name: 'Surface Low',
      var: '--color-surface-low',
      bg: 'bg-[var(--color-surface-low)]',
      text: 'text-[var(--color-text)]',
    },
    {
      name: 'Surface Mid',
      var: '--color-surface-mid',
      bg: 'bg-[var(--color-surface-mid)]',
      text: 'text-[var(--color-text)]',
    },
    {
      name: 'Border',
      var: '--color-border',
      bg: 'bg-[var(--color-border)]',
      text: 'text-[var(--color-text)]',
    },
    {
      name: 'Text',
      var: '--color-text',
      bg: 'bg-[var(--color-text)]',
      text: 'text-[var(--color-surface)]',
    },
    {
      name: 'Text Muted',
      var: '--color-text-muted',
      bg: 'bg-[var(--color-text-muted)]',
      text: 'text-[var(--color-surface)]',
    },
    {
      name: 'Text Faint',
      var: '--color-text-faint',
      bg: 'bg-[var(--color-text-faint)]',
      text: 'text-[var(--color-surface)]',
    },
  ]

  return (
    <div className="container mx-auto p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tight">Design System & Theme</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Reference for CSS variables and design tokens used in this project.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold border-b border-[var(--color-border)] pb-2 uppercase tracking-wide">
          Color Palette
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map((color) => (
            <div
              key={color.var}
              className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
            >
              <div
                className={`h-24 ${color.bg} flex items-center justify-center font-bold ${color.text}`}
              >
                {color.name}
              </div>
              <div className="p-4">
                <code className="block text-xs font-mono text-[var(--color-primary)]">
                  {color.var}
                </code>
                <p className="mt-1 text-[10px] text-[var(--color-text-faint)] uppercase font-bold">
                  Standard color token
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-bold border-b border-[var(--color-border)] pb-2 uppercase tracking-wide">
          Typography
        </h2>
        <div className="space-y-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--color-text-faint)] mb-1 block">
              Heading 1
            </span>
            <h1 className="text-4xl font-black uppercase tracking-tight">
              The quick brown fox jumps over the lazy dog
            </h1>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--color-text-faint)] mb-1 block">
              Heading 2
            </span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              The quick brown fox jumps over the lazy dog
            </h2>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--color-text-faint)] mb-1 block">
              Body Text
            </span>
            <p className="text-base text-[var(--color-text)]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--color-text-faint)] mb-1 block">
              Muted Text
            </span>
            <p className="text-sm text-[var(--color-text-muted)]">
              This text is used for secondary information and descriptions that shouldn&apos;t grab
              too much attention.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
