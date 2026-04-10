// ─────────────────────────────────────────
// STATUS CONSTANTS
// ─────────────────────────────────────────
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  BANNED: 'banned',
} as const

export type StatusKey = (typeof STATUS)[keyof typeof STATUS]

// ─────────────────────────────────────────
// HTTP STATUS CODES
// ─────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
} as const

// ─────────────────────────────────────────
// PLAN (SaaS)
// ─────────────────────────────────────────
export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type PlanKey = (typeof PLANS)[keyof typeof PLANS]
