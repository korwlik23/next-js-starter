'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/components/table/DataTable'
import { useDebounce, usePagination } from '@/hooks'
import { Badge } from '@/components/ui'

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
    <div>
      {/* Header — Module title + Create button */}
      <header className="mb-10">
        <div className="flex justify-between items-end">
          <div>
            <p className="label-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
              Module
            </p>
            <h1 className="text-4xl font-extrabold tracking-tighter" style={{ color: 'var(--color-primary)' }}>
              {module_label}
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
              {total} total records
            </p>
          </div>
          <Link href={`/${module_name}/create`} className="btn-primary">
            <span className="material-symbols-outlined text-sm">add</span>
            New {module_label}
          </Link>
        </div>
      </header>

      {/* Table — editorial card wrapper */}
      <div className="editorial-card-elevated overflow-hidden">
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
            <div className="flex gap-2">
              <Link
                href={`/${module_name}/${row.id}`}
                className="btn-secondary text-[10px] py-1 px-2"
              >
                View
              </Link>
              <Link
                href={`/${module_name}/${row.id}/edit`}
                className="btn-secondary text-[10px] py-1 px-2"
              >
                Edit
              </Link>
            </div>
          )}
        />
      </div>
    </div>
  )
}
