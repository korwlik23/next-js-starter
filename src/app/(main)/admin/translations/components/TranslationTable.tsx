import { useTranslations } from 'next-intl'
import { AlertCircle, Edit3, Languages, RefreshCw, Search } from 'lucide-react'
import { Badge, Button, SelectMenu } from '@/components/ui'
import { ALL, STATUS_FILTERS, type Translation } from '../types'

type TranslationTableProps = {
  translations: Translation[]
  loading: boolean
  error: string
  selectedNamespace: string
  setSelectedNamespace: (namespace: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  search: string
  setSearch: (search: string) => void
  fetchTranslations: () => Promise<void>
  namespaces: string[]
  namespaceCounts: Record<string, number>
  filteredData: Translation[]
  handleOpenModal: (item: Translation) => void
}

export function TranslationTable({
  translations,
  loading,
  error,
  selectedNamespace,
  setSelectedNamespace,
  selectedStatus,
  setSelectedStatus,
  search,
  setSearch,
  fetchTranslations,
  namespaces,
  namespaceCounts,
  filteredData,
  handleOpenModal,
}: TranslationTableProps) {
  const t = useTranslations('translationsAdmin')
  const tCommon = useTranslations('common')

  return (
    <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase text-[var(--color-primary)]">
              {t('tableDescription')}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {t('showingCount', { count: filteredData.length, total: translations.length })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              />
            </div>
            <SelectMenu
              aria-label={t('namespaceFilter')}
              value={selectedNamespace}
              onValueChange={setSelectedNamespace}
              options={[
                { label: t('allNamespaces'), value: ALL },
                ...namespaces.map((namespace) => ({
                  label: `${namespace} (${namespaceCounts[namespace] ?? 0})`,
                  value: namespace,
                })),
              ]}
              className="sm:w-64"
            />
            <SelectMenu
              aria-label={t('statusFilter')}
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              options={STATUS_FILTERS.map((item) => ({
                label: t(item.labelKey),
                value: item.value,
              }))}
              className="sm:w-56"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                {t('namespace')}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                {t('key')}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                {t('value')}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                {t('status')}
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                {tCommon('edit')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/60">
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-4 py-4">
                    <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-56 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-[var(--color-surface-mid)]" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="ml-auto h-8 w-8 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center">
                  <div className="mx-auto max-w-md">
                    <AlertCircle className="mx-auto h-8 w-8 text-[var(--color-error)]" />
                    <p className="mt-3 text-sm font-bold text-[var(--color-text)]">{error}</p>
                    <Button className="mt-4" variant="secondary" onClick={() => fetchTranslations()}>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      {t('refresh')}
                    </Button>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-md">
                    <Languages className="mx-auto h-9 w-9 text-[var(--color-text-faint)]" />
                    <p className="mt-3 text-sm font-bold text-[var(--color-text)]">
                      {t('noResults')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {t('noResultsDescription')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[var(--color-surface-low)]/70"
                >
                  <td className="px-4 py-4 align-top">
                    <Badge variant="neutral" className="max-w-48 truncate text-[10px]">
                      {item.namespace}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <code className="block max-w-[18rem] truncate text-xs font-bold text-[var(--color-info)]">
                      {item.key}
                    </code>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-muted)]">
                      {item.value || item.effectiveValue || '-'}
                    </p>
                    {(!item.value || item.baseValue !== item.value) && (
                      <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words border-l-2 border-[var(--color-border)] pl-3 text-xs leading-5 text-[var(--color-text-faint)]">
                        {t('baseValue')}: {item.baseValue}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge
                      variant={
                        item.status === 'missing'
                          ? 'warning'
                          : item.status === 'published'
                            ? 'success'
                            : 'outline'
                      }
                    >
                      {t(`${item.status}Label`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${tCommon('edit')} ${item.namespace}.${item.key}`}
                      onClick={() => handleOpenModal(item)}
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
