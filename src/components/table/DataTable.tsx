'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/hooks'

// ────────────────────────────────────────
// DataTable — Reusable Table Component
// รองรับ: pagination, search, sorting, filter, actions
// ────────────────────────────────────────

/** ประเภทการเรียงลำดับ */
type SortOrder = 'asc' | 'desc' | null

/** กำหนดค่าตัวกรองของคอลัมน์ */
interface ColumnFilter {
  key: string
  value: string
}

/** โครงสร้างคอลัมน์ */
interface Column<T> {
  /** key ของข้อมูลในแถว */
  key: keyof T | string
  /** ข้อความหัวคอลัมน์ */
  label: string
  /** ฟังก์ชัน render custom content */
  render?: (row: T) => React.ReactNode
  /** อนุญาตให้เรียงลำดับ */
  sortable?: boolean
  /** อนุญาตให้กรอง */
  filterable?: boolean
  /** ตัวเลือกสำหรับ filter แบบ dropdown */
  filter_options?: { label: string; value: string }[]
}

interface DataTableProps<T> {
  /** ข้อมูลที่จะแสดง */
  data: T[]
  /** คอลัมน์ทั้งหมด */
  columns: Column<T>[]
  /** จำนวนรายการทั้งหมด (สำหรับ pagination) */
  total?: number
  /** หน้าปัจจุบัน */
  page?: number
  /** จำนวนรายการต่อหน้า */
  limit?: number
  /** สถานะกำลังโหลด */
  isLoading?: boolean
  /** แสดง search bar */
  searchable?: boolean
  /** callback เปลี่ยนหน้า */
  onPageChange?: (page: number) => void
  /** callback ค้นหา */
  onSearch?: (search: string) => void
  /** callback เรียงลำดับ (server-side sorting) */
  onSort?: (key: string, order: 'asc' | 'desc') => void
  /** callback กรอง (server-side filtering) */
  onFilter?: (filters: ColumnFilter[]) => void
  /** ฟังก์ชัน render action column */
  actions?: (row: T) => React.ReactNode
  /** ข้อความเมื่อไม่มีข้อมูล */
  emptyMessage?: string
  /** ใช้ client-side sorting (ถ้าไม่มี onSort) */
  clientSideSort?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  total = 0,
  page = 1,
  limit = 10,
  isLoading = false,
  searchable = true,
  onPageChange,
  onSearch,
  onSort,
  onFilter,
  actions,
  emptyMessage = 'ไม่พบข้อมูล',
  clientSideSort = true,
}: DataTableProps<T>) {
  // ── URL query params สำหรับ search sync
  const search_params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ── อ่านค่า search เริ่มต้นจาก URL query param ?q=
  const initial_query = search_params.get('q') ?? ''

  // ── State สำหรับ search, sort, filter
  const [search_input, setSearchInput] = useState(initial_query)
  const [sort_key, setSortKey] = useState<string | null>(null)
  const [sort_order, setSortOrder] = useState<SortOrder>(null)
  const [active_filters, setActiveFilters] = useState<Record<string, string>>({})
  const [show_filters, setShowFilters] = useState(false)

  // ── Debounce search input
  const debounced_search = useDebounce(search_input, 400)

  // ── Sync debounced search กลับไปยัง URL query params
  useEffect(() => {
    const current_q = search_params.get('q') ?? ''

    // ป้องกัน infinite loop: เช็คว่าค่าเปลี่ยนจริงๆ หรือไม่
    if (debounced_search === current_q) return

    const params = new URLSearchParams(search_params.toString())
    if (debounced_search) {
      params.set('q', debounced_search)
    } else {
      params.delete('q')
    }

    const query_string = params.toString()
    const new_url = query_string ? `${pathname}?${query_string}` : pathname

    // ใช้ replace เพื่อไม่ให้รก history stack
    router.replace(new_url, { scroll: false })
  }, [debounced_search, pathname, router, search_params])

  // ── คำนวณจำนวนหน้าทั้งหมด
  const total_pages = Math.max(1, Math.ceil(total / limit))

  // ── จัดการ sort column
  const HandleSort = useCallback(
    (key: string) => {
      let new_order: SortOrder = 'asc'

      // สลับ asc → desc → null (reset)
      if (sort_key === key) {
        if (sort_order === 'asc') new_order = 'desc'
        else if (sort_order === 'desc') new_order = null
      }

      setSortKey(new_order ? key : null)
      setSortOrder(new_order)

      // ถ้ามี server-side sort callback → ส่งค่ากลับ
      if (onSort && new_order) {
        onSort(key, new_order)
      }
    },
    [sort_key, sort_order, onSort]
  )

  // ── จัดการ filter
  const HandleFilterChange = useCallback(
    (key: string, value: string) => {
      setActiveFilters((prev) => {
        const next = { ...prev }
        if (value === '' || value === '__all__') {
          delete next[key]
        } else {
          next[key] = value
        }

        // ส่ง filter กลับ parent ถ้ามี callback
        if (onFilter) {
          const filter_array = Object.entries(next).map(([k, v]) => ({ key: k, value: v }))
          onFilter(filter_array)
        }

        return next
      })
    },
    [onFilter]
  )

  // ── Client-side sorting — sort data ในหน่วยความจำ
  const sorted_data = useMemo(() => {
    if (!clientSideSort || !sort_key || !sort_order || onSort) return data

    return [...data].sort((a, b) => {
      const val_a = a[sort_key]
      const val_b = b[sort_key]

      // จัดการค่า null/undefined
      if (val_a == null && val_b == null) return 0
      if (val_a == null) return sort_order === 'asc' ? -1 : 1
      if (val_b == null) return sort_order === 'asc' ? 1 : -1

      // เปรียบเทียบตามประเภทข้อมูล
      if (typeof val_a === 'string' && typeof val_b === 'string') {
        return sort_order === 'asc' ? val_a.localeCompare(val_b) : val_b.localeCompare(val_a)
      }

      if (typeof val_a === 'number' && typeof val_b === 'number') {
        return sort_order === 'asc' ? val_a - val_b : val_b - val_a
      }

      return 0
    })
  }, [data, sort_key, sort_order, clientSideSort, onSort])

  // ── ดึงค่า cell จาก row
  function GetCellValue(row: T, key: string): React.ReactNode {
    const val = row[key]
    if (val === null || val === undefined) return '—'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    return String(val)
  }

  // ── Render Sort Icon
  function RenderSortIcon(col_key: string) {
    if (sort_key !== col_key) {
      // ไอคอนสีจางแสดงว่า sortable
      return (
        <span
          className="material-symbols-outlined text-xs opacity-30 ml-1"
          style={{ fontSize: '14px' }}
        >
          unfold_more
        </span>
      )
    }
    return (
      <span
        className="material-symbols-outlined text-xs ml-1"
        style={{ fontSize: '14px', color: 'var(--color-primary, white)' }}
      >
        {sort_order === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    )
  }

  // ── ตรวจสอบว่ามี column ที่ filterable หรือไม่
  const has_filterable_columns = columns.some((col) => col.filterable)
  const active_filter_count = Object.keys(active_filters).length

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Toolbar: Search + Filter Toggle */}
      {(searchable || has_filterable_columns) && (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* ช่องค้นหา */}
          {searchable && (
            <div className="relative flex-1 max-w-md group">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg transition-colors group-focus-within:text-[var(--color-primary)]"
                style={{ color: 'var(--color-text-faint)' }}
              >
                search
              </span>
              <input
                type="text"
                value={search_input}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  onSearch?.(e.target.value)
                }}
                placeholder="Search records..."
                className="editorial-input w-full pl-10 text-sm shadow-sm focus:shadow-md transition-all"
              />
            </div>
          )}

          {/* ปุ่ม toggle filter panel */}
          {has_filterable_columns && (
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-sm hover:shadow-md transition-all"
              style={{
                borderColor:
                  active_filter_count > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: active_filter_count > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                backgroundColor: show_filters ? 'var(--color-surface-low)' : 'transparent',
              }}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filters
              {active_filter_count > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[8px] flex items-center justify-center">
                  {active_filter_count}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Filter Panel — แสดงเมื่อเปิด */}
      {show_filters && has_filterable_columns && (
        <div
          className="mb-4 p-4 rounded-[var(--radius-md)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300 shadow-inner"
          style={{
            backgroundColor: 'var(--color-surface-low)',
            border: '1px solid var(--color-border)',
          }}
        >
          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={String(col.key)} className="flex flex-col gap-2">
                <label
                  className="text-[10px] font-black uppercase"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  {col.label}
                </label>
                {col.filter_options ? (
                  <select
                    value={active_filters[String(col.key)] ?? '__all__'}
                    onChange={(e) => HandleFilterChange(String(col.key), e.target.value)}
                    className="editorial-input text-xs py-2 px-3 bg-transparent"
                  >
                    <option value="__all__">All {col.label}</option>
                    {col.filter_options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={active_filters[String(col.key)] ?? ''}
                    onChange={(e) => HandleFilterChange(String(col.key), e.target.value)}
                    placeholder={`Filter ${col.label}...`}
                    className="editorial-input text-xs py-2 px-3 bg-transparent"
                  />
                )}
              </div>
            ))}

          {/* ปุ่มล้าง filter */}
          {active_filter_count > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setActiveFilters({})
                  onFilter?.([])
                }}
                className="text-[10px] font-black uppercase px-4 py-2 hover:underline transition-all"
                style={{ color: 'var(--color-error)' }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table Container */}
      <div className="-mx-4 overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sm:mx-0 sm:rounded-[var(--radius-md)] sm:border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            {/* ── Table Header */}
            <thead>
              <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-border)]">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`text-left px-4 py-3 text-[10px] font-black uppercase transition-colors sm:px-5 ${
                      col.sortable
                        ? 'cursor-pointer select-none hover:text-[var(--color-primary)]'
                        : ''
                    }`}
                    style={{ color: 'var(--color-text-faint)' }}
                    onClick={col.sortable ? () => HandleSort(String(col.key)) : undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && RenderSortIcon(String(col.key))}
                    </span>
                  </th>
                ))}
                {actions && (
                  <th
                    className="text-right px-4 py-3 text-[10px] font-black uppercase sm:px-5"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* ── Table Body */}
            <tbody className="divide-y divide-[var(--color-border)]/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-4 sm:px-5">
                        <div className="h-4 bg-[var(--color-surface-mid)] animate-pulse rounded-md w-3/4 shadow-inner" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-4 sm:px-5">
                        <div className="h-4 bg-[var(--color-surface-mid)] animate-pulse rounded-md w-12 ml-auto shadow-inner" />
                      </td>
                    )}
                  </tr>
                ))
              ) : sorted_data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-16 text-center sm:px-5"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-text-faint)]">
                        <span className="material-symbols-outlined text-3xl">inbox_customize</span>
                      </div>
                      <div className="space-y-1">
                        <p
                          className="text-sm font-black tracking-tight"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {emptyMessage}
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Try adjusting your search or filters to find what you&apos;re looking for.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted_data.map((row, i) => (
                  <tr
                    key={i}
                    className="group transition-colors hover:bg-[var(--color-surface-low)]/50"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-4 py-4 text-sm font-medium sm:px-5"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {col.render ? (
                          <div className="transition-transform group-hover:translate-x-0.5 duration-300">
                            {col.render(row)}
                          </div>
                        ) : (
                          <span className="group-hover:text-[var(--color-primary)] transition-colors">
                            {GetCellValue(row, String(col.key))}
                          </span>
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-4 text-right sm:px-5">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
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
      </div>

      {/* ── Pagination */}
      {total > 0 && (
        <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p
            className="text-[10px] font-black uppercase"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of{' '}
            {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] border transition-all disabled:opacity-20 hover:bg-[var(--color-surface-low)] shadow-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>

            {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, total_pages - 4)) + i
              if (p < 1 || p > total_pages) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className="w-10 h-10 rounded-[var(--radius-md)] text-xs font-bold border transition-colors"
                  style={{
                    backgroundColor: p === page ? 'var(--color-primary, white)' : 'transparent',
                    color:
                      p === page
                        ? 'var(--color-on-primary, black)'
                        : 'var(--color-text-muted, #777)',
                    borderColor:
                      p === page ? 'var(--color-primary, white)' : 'var(--color-border, #1a1a1a)',
                  }}
                >
                  {p}
                </button>
              )
            })}

            {/* ปุ่มถัดไป */}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= total_pages}
              className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--color-border, #1a1a1a)',
                color: 'var(--color-text-muted, #777)',
              }}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
