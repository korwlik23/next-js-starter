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
    const params = new URLSearchParams(search_params.toString())
    if (debounced_search) {
      params.set('q', debounced_search)
    } else {
      params.delete('q')
    }
    const query_string = params.toString()
    const new_url = query_string ? `${pathname}?${query_string}` : pathname
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
        return sort_order === 'asc'
          ? val_a.localeCompare(val_b)
          : val_b.localeCompare(val_a)
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
    <div className="w-full">
      {/* ── Toolbar: Search + Filter Toggle */}
      {(searchable || has_filterable_columns) && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          {/* ช่องค้นหา */}
          {searchable && (
            <>
              <span className="material-symbols-outlined text-[1.1rem]" style={{ color: 'var(--color-text-faint, #777)' }}>
                search
              </span>
              <input
                type="text"
                value={search_input}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  onSearch?.(e.target.value)
                }}
                placeholder="ค้นหา..."
                className="editorial-input flex-1"
              />
            </>
          )}

          {/* ปุ่ม toggle filter panel */}
          {has_filterable_columns && (
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
              style={{
                border: '1px solid var(--color-border, #1a1a1a)',
                color: active_filter_count > 0 ? 'var(--color-primary, white)' : 'var(--color-text-muted, #777)',
                backgroundColor: show_filters ? 'var(--color-surface-mid, #111)' : 'transparent',
              }}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
              {active_filter_count > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary, white)',
                    color: 'var(--color-on-primary, black)',
                  }}
                >
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
          className="mb-4 p-4 rounded-lg flex flex-wrap gap-4"
          style={{
            backgroundColor: 'var(--color-surface, #0d0d0d)',
            border: '1px solid var(--color-border, #1a1a1a)',
          }}
        >
          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={String(col.key)} className="flex flex-col gap-1.5 min-w-[160px]">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-faint, #777)' }}
                >
                  {col.label}
                </label>
                {col.filter_options ? (
                  // Dropdown filter — สำหรับ column ที่มีตัวเลือก
                  <select
                    value={active_filters[String(col.key)] ?? '__all__'}
                    onChange={(e) => HandleFilterChange(String(col.key), e.target.value)}
                    className="editorial-input text-sm py-1.5"
                  >
                    <option value="__all__">ทั้งหมด</option>
                    {col.filter_options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  // Text filter — สำหรับ column ทั่วไป
                  <input
                    type="text"
                    value={active_filters[String(col.key)] ?? ''}
                    onChange={(e) => HandleFilterChange(String(col.key), e.target.value)}
                    placeholder={`กรอง ${col.label}...`}
                    className="editorial-input text-sm py-1.5"
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
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ color: 'var(--color-danger, #e74c3c)' }}
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table */}
      <div className="border overflow-hidden" style={{ borderColor: 'var(--color-border, #1a1a1a)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ── Table Header */}
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-mid, #0a0a0a)', borderBottom: '1px solid var(--color-border, #1a1a1a)' }}>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest ${
                      col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : ''
                    }`}
                    style={{ color: 'var(--color-text-faint, #555)' }}
                    onClick={col.sortable ? () => HandleSort(String(col.key)) : undefined}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sortable && RenderSortIcon(String(col.key))}
                    </span>
                  </th>
                ))}
                {actions && (
                  <th
                    className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-faint, #555)' }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* ── Table Body */}
            <tbody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle, #0f0f0f)' }}>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-5 py-4">
                        <div className="h-4 bg-neutral-800 animate-pulse rounded-sm w-3/4" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-5 py-4">
                        <div className="h-4 bg-neutral-800 animate-pulse rounded-sm w-16" />
                      </td>
                    )}
                  </tr>
                ))
              ) : sorted_data.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-5 py-16 text-center text-sm"
                    style={{ color: 'var(--color-text-faint, #555)' }}
                  >
                    <span className="material-symbols-outlined text-4xl block mb-3" style={{ color: 'var(--color-border, #1a1a1a)' }}>
                      inbox
                    </span>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                // Data rows
                sorted_data.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border-subtle, #0f0f0f)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-mid, rgba(255,255,255,0.02))')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-5 py-3.5 text-sm"
                        style={{ color: 'var(--color-text-secondary, #bbb)' }}
                      >
                        {col.render ? col.render(row) : GetCellValue(row, String(col.key))}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">{actions(row)}</div>
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
        <div className="mt-4 flex items-center justify-between">
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-text-faint, #555)' }}
          >
            แสดง {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} จาก{' '}
            {total} รายการ
          </p>
          <div className="flex items-center gap-1">
            {/* ปุ่มก่อนหน้า */}
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border, #1a1a1a)', color: 'var(--color-text-muted, #777)' }}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {/* ปุ่มหมายเลขหน้า */}
            {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, total_pages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className="w-8 h-8 text-xs font-bold border transition-colors"
                  style={{
                    backgroundColor: p === page ? 'var(--color-primary, white)' : 'transparent',
                    color: p === page ? 'var(--color-on-primary, black)' : 'var(--color-text-muted, #777)',
                    borderColor: p === page ? 'var(--color-primary, white)' : 'var(--color-border, #1a1a1a)',
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
              className="w-8 h-8 flex items-center justify-center border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border, #1a1a1a)', color: 'var(--color-text-muted, #777)' }}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
