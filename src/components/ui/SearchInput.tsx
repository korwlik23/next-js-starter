'use client'

import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { useDebounce } from '@/hooks'

// ────────────────────────────────────────
// SearchInput — Reusable search component
// รองรับ debounce + URL query param sync
// ────────────────────────────────────────

interface SearchInputProps {
  /** ค่าเริ่มต้นของช่องค้นหา */
  default_value?: string
  /** Placeholder text */
  placeholder?: string
  /** ระยะเวลา debounce (ms) — default 400ms */
  debounce_delay?: number
  /** callback เมื่อค่าเปลี่ยน (หลัง debounce) */
  onChange?: (value: string) => void
  /** sync กับ URL query param — ชื่อ param (e.g. 'q', 'search') */
  query_param?: string
  /** className สำหรับ container */
  className?: string
  /** ขนาดของ input */
  size?: 'sm' | 'md' | 'lg'
  /** auto focus เมื่อ mount */
  auto_focus?: boolean
  /** แสดงปุ่ม clear */
  show_clear?: boolean
}

export function SearchInput({
  default_value = '',
  placeholder = 'ค้นหา...',
  debounce_delay = 400,
  onChange,
  query_param,
  className = '',
  size = 'md',
  auto_focus = false,
  show_clear = true,
}: SearchInputProps) {
  // อ่านค่าจาก URL query param ถ้ามี
  const [search_value, set_search_value] = useState(() => {
    if (typeof window !== 'undefined' && query_param) {
      const params = new URLSearchParams(window.location.search)
      return params.get(query_param) || default_value
    }
    return default_value
  })

  // Debounce ค่าที่พิมพ์
  const debounced_value = useDebounce(search_value, debounce_delay)

  // เมื่อค่า debounced เปลี่ยน — เรียก callback และ sync URL
  useEffect(() => {
    onChange?.(debounced_value)

    // Sync กับ URL query param ถ้าระบุ
    if (query_param && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (debounced_value) {
        url.searchParams.set(query_param, debounced_value)
      } else {
        url.searchParams.delete(query_param)
      }
      window.history.replaceState({}, '', url.toString())
    }
  }, [debounced_value, onChange, query_param])

  // Handler สำหรับ input change
  const HandleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    set_search_value(e.target.value)
  }, [])

  // Handler สำหรับ clear
  const HandleClear = useCallback(() => {
    set_search_value('')
  }, [])

  // คำนวณ size classes
  const SIZE_CLASSES = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-5',
  } as const

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 6px)',
      }}
    >
      {/* ไอคอนค้นหา */}
      <span
        className="material-symbols-outlined text-[1rem] absolute left-3"
        style={{ color: 'var(--color-text-faint)' }}
      >
        search
      </span>

      {/* Input field */}
      <input
        id="search-input"
        type="text"
        value={search_value}
        onChange={HandleChange}
        placeholder={placeholder}
        autoFocus={auto_focus}
        className={`w-full bg-transparent border-none focus:outline-none font-medium pl-9 ${SIZE_CLASSES[size]}`}
        style={{ color: 'var(--color-text)' }}
        aria-label="Search"
      />

      {/* ปุ่ม Clear */}
      {show_clear && search_value && (
        <button
          onClick={HandleClear}
          className="absolute right-3 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-faint)' }}
          aria-label="Clear search"
          type="button"
        >
          <span className="material-symbols-outlined text-[1rem]">close</span>
        </button>
      )}
    </div>
  )
}
