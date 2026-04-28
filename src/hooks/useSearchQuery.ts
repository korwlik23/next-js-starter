'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks'

// ─────────────────────────────────────────
// useSearchQuery — ค้นหาแบบ sync กับ URL query params
// รองรับ debounce + pagination reset อัตโนมัติ
// ─────────────────────────────────────────

interface UseSearchQueryOptions {
  /** ชื่อ query param สำหรับ search (default: 'q') */
  param_name?: string
  /** ระยะเวลา debounce เป็น ms (default: 400) */
  delay?: number
  /** reset page กลับไป 1 เมื่อ search เปลี่ยน (default: true) */
  should_reset_page?: boolean
  /** ชื่อ query param สำหรับ page (default: 'page') */
  page_param_name?: string
}

interface UseSearchQueryReturn {
  /** ค่าที่ user พิมพ์ (real-time) */
  query: string
  /** ค่าที่ผ่าน debounce แล้ว — ใช้สำหรับ fetch data */
  debounced_query: string
  /** เปลี่ยนค่า search */
  SetQuery: (value: string) => void
  /** ล้าง search ทั้งหมด */
  ClearQuery: () => void
  /** มีค่า search อยู่หรือไม่ */
  has_query: boolean
}

/**
 * Hook สำหรับค้นหาข้อมูลแบบ sync กับ URL query parameters
 * - Debounce input เพื่อลด API calls
 * - Sync ค่ากับ URL (?q=xxx) เพื่อ bookmark/share ได้
 * - Reset pagination กลับหน้า 1 อัตโนมัติเมื่อ search เปลี่ยน
 *
 * @example
 * const { query, debounced_query, SetQuery, ClearQuery } = UseSearchQuery()
 * // ใช้ debounced_query สำหรับ fetch data
 * // ใช้ query สำหรับแสดงใน input
 */
export function UseSearchQuery(options: UseSearchQueryOptions = {}): UseSearchQueryReturn {
  const {
    param_name = 'q',
    delay = 400,
    should_reset_page = true,
    page_param_name = 'page',
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const search_params = useSearchParams()

  // อ่านค่าเริ่มต้นจาก URL query param
  const initial_query = search_params.get(param_name) ?? ''
  const [query, setQuery] = useState(initial_query)

  // ใช้ debounce เพื่อลดจำนวน URL updates
  const debounced_query = useDebounce(query, delay)

  // ── Sync debounced value กลับไปยัง URL
  useEffect(() => {
    const params = new URLSearchParams(search_params.toString())
    const current_val = search_params.get(param_name) ?? ''

    // ป้องกัน infinite loop: เช็คว่าค่าเปลี่ยนจริงๆ หรือไม่
    if (debounced_query === current_val) return

    // ถ้ามีค่า → set param, ถ้าว่าง → ลบ param
    if (debounced_query) {
      params.set(param_name, debounced_query)
    } else {
      params.delete(param_name)
    }

    // Reset page กลับไป 1 เมื่อ search เปลี่ยน
    if (should_reset_page) {
      params.delete(page_param_name)
    }

    // อัพเดต URL โดยไม่ reload page
    const query_string = params.toString()
    const new_url = query_string ? `${pathname}?${query_string}` : pathname
    router.replace(new_url, { scroll: false })
  }, [
    debounced_query,
    pathname,
    router,
    search_params,
    param_name,
    page_param_name,
    should_reset_page,
  ])

  // ── ฟังก์ชัน set query
  const SetQuery = useCallback((value: string) => {
    setQuery(value)
  }, [])

  // ── ฟังก์ชัน clear query
  const ClearQuery = useCallback(() => {
    setQuery('')
  }, [])

  return {
    query,
    debounced_query,
    SetQuery,
    ClearQuery,
    has_query: debounced_query.length > 0,
  }
}
