'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/components/table/DataTable'
import { useDebounce, usePagination } from '@/hooks'

export default function ModuleListPage() {
  const params = useParams<{ module: string }>()
  const t = useTranslations('moduleList')
  const moduleName = params.module ?? 'items'
  const moduleLabel = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const { page, limit, goToPage } = usePagination(1, 10)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const res = await fetch(`/api/${moduleName}?${qs}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? [])
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [moduleName, page, limit, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = data[0]
    ? Object.keys(data[0])
        .filter((key) => !['password', 'deletedAt'].includes(key))
        .slice(0, 5)
        .map((key) => ({
          key,
          label: key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim(),
        }))
    : [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ]

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="mb-12 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full" />
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {t('systemModule')}
              </p>
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tighter"
              style={{ color: 'var(--color-primary)' }}
            >
              {moduleLabel}
            </h1>
            <div className="mt-2 flex items-center gap-4">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t('description', { module: moduleLabel.toLowerCase() })}
              </p>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
              <p
                className="text-[10px] font-black uppercase tracking-tighter"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {t('totalRecords', { total })}
              </p>
            </div>
          </div>

          <Link
            href={`/${moduleName}/create`}
            className="btn-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            {t('newRecord', { module: moduleLabel })}
          </Link>
        </div>
      </header>

      <div className="relative">
        <DataTable
          data={data}
          columns={columns}
          total={total}
          page={page}
          limit={limit}
          isLoading={isLoading}
          onPageChange={goToPage}
          onSearch={setSearch}
          actions={(row) => (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${moduleName}/${row.id}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-low)] transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                title={t('viewDetails')}
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
              </Link>
              <Link
                href={`/${moduleName}/${row.id}/edit`}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-low)] transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                title={t('editRecord')}
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </Link>
            </div>
          )}
        />
      </div>
    </div>
  )
}
