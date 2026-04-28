'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import toast from 'react-hot-toast'

// ────────────────────────────────────────
// React Query Patterns — Standardized Hooks
// Query Key Factory + Auto Error Handling
// ────────────────────────────────────────

/**
 * Query Key Factory — สร้าง query keys ที่ consistent
 * ป้องกัน typo และ invalidation ที่ไม่ตรง
 * @example queryKeys.users.list({ page: 1 })
 * @example queryKeys.users.detail('abc123')
 */
export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (params?: Record<string, unknown>) => ['audit', 'list', params] as const,
  },
  translations: {
    all: ['translations'] as const,
    list: (params?: Record<string, unknown>) => ['translations', 'list', params] as const,
  },
  features: {
    all: ['features'] as const,
    list: () => ['features', 'list'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
    unread: () => ['notifications', 'unread'] as const,
  },
  billing: {
    all: ['billing'] as const,
    subscription: (tenantId: string) => ['billing', 'subscription', tenantId] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: (params?: Record<string, unknown>) => ['analytics', 'dashboard', params] as const,
  },
} as const

// ────────────────────────────────────────
// useApiQuery — standardized GET with error handling
// ────────────────────────────────────────

interface UseApiQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  /** แสดง toast เมื่อ error (default: true) */
  showErrorToast?: boolean
}

/**
 * Hook สำหรับ GET request พร้อม React Query caching
 * @example const { data, isLoading } = useApiQuery(['users', 'list'], '/api/user')
 */
export function useApiQuery<T = unknown>(
  queryKey: readonly unknown[],
  url: string,
  options?: UseApiQueryOptions<T>
) {
  const { showErrorToast: _showErrorToast = true, ...queryOptions } = options ?? {}

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const result = await apiClient<T>(url)
      if (result.error) throw new Error(result.error)
      return result.data as T
    },
    ...queryOptions,
  })
}

// ────────────────────────────────────────
// useApiMutation — standardized POST/PATCH/DELETE
// ────────────────────────────────────────

interface UseApiMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'mutationFn'
> {
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** แสดง toast เมื่อสำเร็จ */
  successMessage?: string
  /** แสดง toast เมื่อ error (default: true) */
  showErrorToast?: boolean
  /** Invalidate query keys หลังสำเร็จ */
  invalidateKeys?: readonly unknown[][]
}

/**
 * Hook สำหรับ POST/PATCH/PUT/DELETE request
 * @example const mutation = useApiMutation('/api/user', { method: 'POST', successMessage: 'สร้างผู้ใช้สำเร็จ' })
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient()
  const {
    method = 'POST',
    successMessage,
    showErrorToast = true,
    invalidateKeys,
    ...mutationOptions
  } = options ?? {}

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const result = await apiClient<TData>(url, { method, body: variables })
      if (result.error) throw new Error(result.error)
      return result.data as TData
    },
    onSuccess: (...args) => {
      // แสดง toast สำเร็จ
      if (successMessage) {
        toast.success(successMessage)
      }

      // Invalidate related queries
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }

      // เรียก onSuccess จาก options ถ้ามี
      mutationOptions.onSuccess?.(...args)
    },
    onError: (...args) => {
      const [error] = args

      // แสดง toast error
      if (showErrorToast) {
        toast.error(error.message || 'เกิดข้อผิดพลาด')
      }

      // เรียก onError จาก options ถ้ามี
      mutationOptions.onError?.(...args)
    },
    ...mutationOptions,
  })
}

// ────────────────────────────────────────
// Optimistic Update Helper
// ────────────────────────────────────────

/**
 * สร้าง optimistic update callbacks สำหรับ useMutation
 * อัปเดต cache ทันทีก่อนรอ server response
 * @example useApiMutation('/api/user', { ...optimisticUpdate(queryKeys.users.list(), updatedList) })
 */
export function createOptimisticUpdate<T>(
  queryClient: import('@tanstack/react-query').QueryClient,
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
) {
  return {
    onMutate: async () => {
      // ยกเลิก queries ที่กำลัง fetch อยู่
      await queryClient.cancelQueries({ queryKey })

      // Snapshot ค่าเก่า
      const previousData = queryClient.getQueryData<T>(queryKey)

      // Optimistic update
      queryClient.setQueryData<T>(queryKey, (old) => updater(old))

      return { previousData }
    },
    onError: (_error: Error, _variables: unknown, context: { previousData?: T } | undefined) => {
      // Rollback ถ้า error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Refetch เพื่อ sync กับ server
      queryClient.invalidateQueries({ queryKey })
    },
  }
}
