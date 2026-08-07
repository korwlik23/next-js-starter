// ─────────────────────────────────────────────
// API Client — fetch wrapper with auto-refresh
// ─────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiClientOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
}

interface ApiResult<T> {
  data: T | null
  error: string | null
  status: number
}

const PAGINATION_META_FIELDS = ['total', 'page', 'limit', 'totalPages'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPaginatedResponse(value: unknown): boolean {
  if (!isRecord(value) || value.data === undefined) return false

  const meta = value.meta
  if (!isRecord(meta)) return false

  return PAGINATION_META_FIELDS.some((field) => field in meta)
}

let isRefreshing = false

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) return false
  isRefreshing = true
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } finally {
    isRefreshing = false
  }
}

export async function apiClient<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, headers = {} } = options

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const reqInit: RequestInit = {
    method,
    headers: reqHeaders,
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  let res = await fetch(url, reqInit)

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await fetch(url, reqInit)
    }
  }

  const status = res.status

  if (status === 204) return { data: null, error: null, status }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    return { data: null, error: json?.message ?? `HTTP ${status}`, status }
  }

  // Keep pagination metadata available while unwrapping correlation-only success envelopes.
  const resultData = isPaginatedResponse(json) ? json : (json?.data ?? json)

  return { data: resultData, error: null, status }
}

// ─────────────────────────────────────────────
// Convenience methods
// ─────────────────────────────────────────────
export const api = {
  get: <T>(url: string, headers?: Record<string, string>) =>
    apiClient<T>(url, { method: 'GET', headers }),

  post: <T>(url: string, body: unknown) => apiClient<T>(url, { method: 'POST', body }),

  patch: <T>(url: string, body: unknown) => apiClient<T>(url, { method: 'PATCH', body }),

  put: <T>(url: string, body: unknown) => apiClient<T>(url, { method: 'PUT', body }),

  delete: <T>(url: string) => apiClient<T>(url, { method: 'DELETE' }),
}
