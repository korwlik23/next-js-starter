import { useTranslations } from 'next-intl'
import { AlertCircle, Globe2, Layers3, Type } from 'lucide-react'

type StatsValues = {
  total: number
  namespaces: number
  missing: number
  published: number
}

type StatsProps = {
  stats: StatsValues
}

export function Stats({ stats }: StatsProps) {
  const t = useTranslations('translationsAdmin')
  const items = [
    { label: t('totalKeys'), value: stats.total, icon: Type },
    { label: t('namespacesCount'), value: stats.namespaces, icon: Layers3 },
    { label: t('missingValues'), value: stats.missing, icon: AlertCircle },
    { label: t('publishedValues'), value: stats.published, icon: Globe2 },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase text-[var(--color-text-faint)]">
              {item.label}
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-surface-low)] text-[var(--color-primary)]">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-black text-[var(--color-primary)]">{item.value}</p>
        </div>
      ))}
    </section>
  )
}
