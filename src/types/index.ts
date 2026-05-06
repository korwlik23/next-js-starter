// ============================================================
// CORE TYPES — Ultimate Next.js Starter
// ============================================================

// ─────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  tenantId?: string | null
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  roles?: UserRole[]
  permissions?: string[] // flattened permission names
}

export interface UserRole {
  roleId: string
  role: Role
}

// ─────────────────────────────────────────
// ROLE & PERMISSION
// ─────────────────────────────────────────
export interface Role {
  id: string
  name: string
  description?: string | null
  tenantId?: string | null
  isSystem: boolean
}

export interface Permission {
  id: string
  name: string
  description?: string | null
  module: string
  action: string
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export interface AuthUser extends User {
  permissions: string[]
}

export interface TokenPayload {
  sub: string // userId
  email: string
  name: string
  roles: string[]
  permissions: string[]
  tenantId?: string | null
  impersonatorId?: string // admin userId who is impersonating
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─────────────────────────────────────────
// PAGINATION & QUERY
// ─────────────────────────────────────────
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─────────────────────────────────────────
// TENANT
// ─────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
}
