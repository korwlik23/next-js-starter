'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/components/table/DataTable'
import { useDebounce, usePagination } from '@/hooks'

// ────────────────────────────────────────
// Module List Page — Dynamic CRUD listing
// ตาม editorial design: clean table, label-xs headers
// ────────────────────────────────────────

export default function ModuleListPage() {
  const params = useParams<{ module: string }>()
  const _router = useRouter()
  const module_name = params.module ?? 'items'
  const module_label = module_name.charAt(0).toUpperCase() + module_name.slice(1)

  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [is_loading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debounced_search = useDebounce(search, 400)
  const { page, limit, goToPage } = usePagination(1, 10)

  /* ดึงข้อมูลจาก API */
  const FetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debounced_search ? { search: debounced_search } : {}),
      })
      const res = await fetch(`/api/${module_name}?${qs}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? [])
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [module_name, page, limit, debounced_search])

  useEffect(() => {
    FetchData()
  }, [FetchData])

  /* สร้าง columns จากข้อมูลแรก */
  const columns = data[0]
    ? Object.keys(data[0])
        .filter((k) => !['password', 'deletedAt'].includes(k))
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
      {/* 1. PAGE HEADER — Unified Pattern */}
      <header className="mb-12 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full" />
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-faint)' }}
              >
                System Module
              </p>
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tighter"
              style={{ color: 'var(--color-primary)' }}
            >
              {module_label}
            </h1>
            <div className="mt-2 flex items-center gap-4">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Manage and monitor your <span className="font-bold lowercase">{module_label}</span>{' '}
                records.
              </p>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
              <p
                className="text-[10px] font-black uppercase tracking-tighter"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {total} Total Records
              </p>
            </div>
          </div>

          <Link
            href={`/${module_name}/create`}
            className="btn-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            New {module_label}
          </Link>
        </div>
      </header>

      {/* 2. DATA TABLE — High Contrast Wrapper */}
      <div className="relative">
        <DataTable
          data={data}
          columns={columns}
          total={total}
          page={page}
          limit={limit}
          isLoading={is_loading}
          onPageChange={goToPage}
          onSearch={setSearch}
          actions={(row) => (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${module_name}/${row.id}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-low)] transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                title="View details"
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
              </Link>
              <Link
                href={`/${module_name}/${row.id}/edit`}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-low)] transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                title="Edit record"
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
