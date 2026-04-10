'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// ────────────────────────────────────────
// QueryProvider — React Query Provider
// ใช้ useState เพื่อให้แต่ละ request ได้ client ของตัวเอง
// ────────────────────────────────────────

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [query_client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ข้อมูลจะ stale หลัง 5 นาที
            staleTime: 5 * 60 * 1000,
            // cache ข้อมูล 10 นาทีก่อนลบ
            gcTime: 10 * 60 * 1000,
            // retry 1 ครั้งถ้า error
            retry: 1,
            // ไม่ refetch เมื่อ focus window (ลด network traffic)
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return <QueryClientProvider client={query_client}>{children}</QueryClientProvider>
}
