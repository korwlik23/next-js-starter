'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Inbox, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/hooks'

type SortOrder = 'asc' | 'desc' | null

interface ColumnFilter {
  key: string
  value: string
}

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filter_options?: { label: string; value: string }[]
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  total?: number
  page?: number
  limit?: number
  is_loading?: boolean
  isLoading?: boolean
  is_searchable?: boolean
  on_page_change?: (page: number) => void
  onPageChange?: (page: number) => void
  on_search?: (search: string) => void
  onSearch?: (search: string) => void
  on_sort?: (key: string, order: 'asc' | 'desc') => void
  on_filter?: (filters: ColumnFilter[]) => void
  actions?: (row: T) => React.ReactNode
  empty_message?: string
  client_side_sort?: boolean
}

export function DataTable<T extends object>({
  data = [],
  columns,
  total = 0,
  page = 1,
  limit = 10,
  is_loading,
  isLoading,
  is_searchable = true,
  on_page_change,
  onPageChange,
  on_search,
  onSearch,
  on_sort,
  on_filter,
  actions,
  empty_message,
  client_side_sort = true,
}: DataTableProps<T>) {
  const t = useTranslations('dataTable')
  const tCommon = useTranslations('common')
  const tTable = useTranslations('table')
  const resolvedIsLoading = is_loading ?? isLoading ?? false
  const resolvedOnPageChange = on_page_change ?? onPageChange
  const resolvedOnSearch = on_search ?? onSearch
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialQuery = searchParams.get('q') ?? ''

  const [searchInput, setSearchInput] = useState(initialQuery)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(searchInput, 400)

  useEffect(() => {
    const currentQuery = searchParams.get('q') ?? ''
    if (debouncedSearch === currentQuery) return

    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    } else {
      params.delete('q')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [debouncedSearch, pathname, router, searchParams])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilterableColumns = columns.some((column) => column.filterable)
  const activeFilterCount = Object.keys(activeFilters).length

  const handleSort = useCallback(
    (key: string) => {
      let nextOrder: SortOrder = 'asc'

      if (sortKey === key) {
        if (sortOrder === 'asc') nextOrder = 'desc'
        else if (sortOrder === 'desc') nextOrder = null
      }

      setSortKey(nextOrder ? key : null)
      setSortOrder(nextOrder)

      if (on_sort && nextOrder) {
        on_sort(key, nextOrder)
      }
    },
    [on_sort, sortKey, sortOrder]
  )

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setActiveFilters((previous) => {
        const next = { ...previous }
        if (!value || value === '__all__') {
          delete next[key]
        } else {
          next[key] = value
        }

        on_filter?.(
          Object.entries(next).map(([filterKey, filterValue]) => ({
            key: filterKey,
            value: filterValue,
          }))
        )

        return next
      })
    },
    [on_filter]
  )

  const sortedData = useMemo(() => {
    if (!client_side_sort || !sortKey || !sortOrder || on_sort) return data

    return [...data].sort((a, b) => {
      const left = (a as Record<string, unknown>)[sortKey]
      const right = (b as Record<string, unknown>)[sortKey]

      if (left == null && right == null) return 0
      if (left == null) return sortOrder === 'asc' ? -1 : 1
      if (right == null) return sortOrder === 'asc' ? 1 : -1

      if (typeof left === 'string' && typeof right === 'string') {
        return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortOrder === 'asc' ? left - right : right - left
      }

      return 0
    })
  }, [client_side_sort, data, on_sort, sortKey, sortOrder])

  function getCellValue(row: T, key: string) {
    const value = (row as Record<string, unknown>)[key]
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? tCommon('yes') : tCommon('no')
    return String(value)
  }

  function renderSortIndicator(columnKey: string) {
    if (sortKey !== columnKey) return <span className="text-[10px] opacity-30">↕</span>
    return <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="w-full">
      {(is_searchable || hasFilterableColumns) && (
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {is_searchable && (
            <div className="relative w-full max-w-sm">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value)
                  resolvedOnSearch?.(event.target.value)
                }}
                placeholder={t('searchRecords')}
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              />
            </div>
          )}

          {hasFilterableColumns && (
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-xs font-bold uppercase text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-low)]"
            >
              <Filter aria-hidden="true" className="h-4 w-4" />
              {t('filters')}
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] text-[var(--color-on-primary)]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {showFilters && hasFilterableColumns && (
        <div className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-low)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
          {columns
            .filter((column) => column.filterable)
            .map((column) => (
              <label key={String(column.key)} className="space-y-1.5">
                <span className="block text-[10px] font-black uppercase text-[var(--color-text-faint)]">
                  {column.label}
                </span>
                {column.filter_options ? (
                  <select
                    value={activeFilters[String(column.key)] ?? '__all__'}
                    onChange={(event) => handleFilterChange(String(column.key), event.target.value)}
                    className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="__all__">
                      {tCommon('all')} {column.label}
                    </option>
                    {column.filter_options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={activeFilters[String(column.key)] ?? ''}
                    onChange={(event) => handleFilterChange(String(column.key), event.target.value)}
                    placeholder={`${t('filters')} ${column.label}`}
                    className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs outline-none focus:border-[var(--color-primary)]"
                  />
                )}
              </label>
            ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]"
                  onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                >
                  <span
                    className={
                      column.sortable
                        ? 'inline-flex cursor-pointer select-none items-center gap-1.5'
                        : ''
                    }
                  >
                    {column.label}
                    {column.sortable && renderSortIndicator(String(column.key))}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="whitespace-nowrap px-4 py-3 text-right text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {tTable('actions')}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)]/60">
            {resolvedIsLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="ml-auto h-4 w-10 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-surface-low)] text-[var(--color-text-faint)]">
                      <Inbox aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        {empty_message ?? t('emptyTitle')}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t('emptyDescription')}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors hover:bg-[var(--color-surface-low)]/70"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 align-middle text-[var(--color-text-muted)]"
                    >
                      {column.render ? column.render(row) : getCellValue(row, String(column.key))}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right align-middle">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row">
          <p className="text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
            {t('showing', {
              start: Math.min((page - 1) * limit + 1, total),
              end: Math.min(page * limit, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => resolvedOnPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label={t('previous')}
              className="grid h-9 w-9 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-low)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              const number = Math.max(1, Math.min(page - 2, totalPages - 4)) + index
              if (number < 1 || number > totalPages) return null

              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => resolvedOnPageChange?.(number)}
                  className="h-9 min-w-9 rounded-md border px-2 text-xs font-bold transition"
                  style={{
                    backgroundColor:
                      number === page ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: number === page ? 'var(--color-on-primary)' : 'var(--color-text-muted)',
                    borderColor: number === page ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  {number}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => resolvedOnPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label={t('next')}
              className="grid h-9 w-9 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-low)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
