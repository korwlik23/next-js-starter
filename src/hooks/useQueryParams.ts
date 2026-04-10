'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// ─────────────────────────────────────────
// useQueryParams — จัดการ URL query params ทั่วไป
// ใช้สำหรับ filter, sort, pagination ที่ sync กับ URL
// ─────────────────────────────────────────

interface UseQueryParamsReturn {
  /** ดึงค่า param จาก URL */
  Get: (key: string) => string | null
  /** ดึงค่า param แบบ number (พร้อม fallback) */
  GetNumber: (key: string, fallback: number) => number
  /** ตั้งค่า param ใน URL */
  Set: (key: string, value: string) => void
  /** ตั้งค่าหลาย params พร้อมกัน */
  SetMultiple: (params: Record<string, string | null>) => void
  /** ลบ param ออกจาก URL */
  Remove: (key: string) => void
  /** ลบหลาย params พร้อมกัน */
  RemoveAll: (keys: string[]) => void
  /** สร้าง query string จาก params ปัจจุบัน */
  ToString: () => string
}

/**
 * Hook สำหรับจัดการ URL query parameters ทั่วไป
 * ใช้สำหรับ filter, sort, pagination ที่ต้อง sync กับ URL
 *
 * @example
 * const params = UseQueryParams()
 * params.Set('sort', 'name')
 * params.Set('order', 'asc')
 * const sort_value = params.Get('sort') // 'name'
 */
export function UseQueryParams(): UseQueryParamsReturn {
  const router = useRouter()
  const pathname = usePathname()
  const search_params = useSearchParams()

  // ── Helper: อัพเดต URL ด้วย params ใหม่
  const UpdateUrl = useCallback(
    (params: URLSearchParams) => {
      const query_string = params.toString()
      const new_url = query_string ? `${pathname}?${query_string}` : pathname
      router.replace(new_url, { scroll: false })
    },
    [pathname, router]
  )

  // ── ดึงค่า param
  const Get = useCallback(
    (key: string): string | null => {
      return search_params.get(key)
    },
    [search_params]
  )

  // ── ดึงค่า param แบบ number พร้อม fallback
  const GetNumber = useCallback(
    (key: string, fallback: number): number => {
      const value = search_params.get(key)
      if (!value) return fallback
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? fallback : parsed
    },
    [search_params]
  )

  // ── ตั้งค่า param เดียว
  const Set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(search_params.toString())
      params.set(key, value)
      UpdateUrl(params)
    },
    [search_params, UpdateUrl]
  )

  // ── ตั้งค่าหลาย params (null = ลบ param นั้น)
  const SetMultiple = useCallback(
    (new_params: Record<string, string | null>) => {
      const params = new URLSearchParams(search_params.toString())
      for (const [key, value] of Object.entries(new_params)) {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      UpdateUrl(params)
    },
    [search_params, UpdateUrl]
  )

  // ── ลบ param เดียว
  const Remove = useCallback(
    (key: string) => {
      const params = new URLSearchParams(search_params.toString())
      params.delete(key)
      UpdateUrl(params)
    },
    [search_params, UpdateUrl]
  )

  // ── ลบหลาย params
  const RemoveAll = useCallback(
    (keys: string[]) => {
      const params = new URLSearchParams(search_params.toString())
      keys.forEach((key) => params.delete(key))
      UpdateUrl(params)
    },
    [search_params, UpdateUrl]
  )

  // ── สร้าง query string
  const ToString = useCallback(() => {
    return search_params.toString()
  }, [search_params])

  return { Get, GetNumber, Set, SetMultiple, Remove, RemoveAll, ToString }
}
