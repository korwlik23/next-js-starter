/**
 * ─────────────────────────────────────────
 * STANDARDIZED ERROR CODES
 * ตามสเปก: ทุก error ต้องมี error code
 * ─────────────────────────────────────────
 */
export const ERROR_CODES = {
  // Auth & Permissions
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  // Request & Validation
  BAD_REQUEST: 'REQ_BAD_REQUEST',
  VALIDATION_ERROR: 'REQ_VALIDATION_ERROR',
  NOT_FOUND: 'REQ_NOT_FOUND',
  CONFLICT: 'REQ_CONFLICT',

  // Resource specific
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  SYSTEM_ROLE_PROTECTED: 'SYSTEM_ROLE_PROTECTED',

  // System
  INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  DATABASE_ERROR: 'SYS_DATABASE_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
