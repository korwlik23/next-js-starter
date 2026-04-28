// ============================================================
// ENUMS — Ultimate Next.js Starter
// กำหนด enum ทั้งหมดที่ใช้ทั่วทั้ง project
// ใช้ as const เพื่อ type-safety ที่สมบูรณ์
// ============================================================

// ─────────────────────────────────────────
// USER STATUS
// ─────────────────────────────────────────
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

// ─────────────────────────────────────────
// SUBSCRIPTION PLAN
// ─────────────────────────────────────────
export const SubscriptionPlan = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan]

// ─────────────────────────────────────────
// SUBSCRIPTION STATUS
// ─────────────────────────────────────────
export const SubscriptionStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  TRIALING: 'trialing',
} as const

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

// ─────────────────────────────────────────
// INVITATION STATUS
// ─────────────────────────────────────────
export const InvitationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
} as const

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus]

// ─────────────────────────────────────────
// NOTIFICATION TYPE
// ─────────────────────────────────────────
export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

// ─────────────────────────────────────────
// AUDIT ACTION
// ─────────────────────────────────────────
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  PASSWORD_CHANGE: 'password_change',
  PERMISSION_CHANGE: 'permission_change',
  INVITE: 'invite',
  REVOKE: 'revoke',
} as const

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

// ─────────────────────────────────────────
// API KEY STATUS
// ─────────────────────────────────────────
export const ApiKeyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
} as const

export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus]

// ─────────────────────────────────────────
// SORT DIRECTION
// ─────────────────────────────────────────
export const SortDirection = {
  ASC: 'asc',
  DESC: 'desc',
} as const

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection]

// ─────────────────────────────────────────
// OAUTH PROVIDER
// ─────────────────────────────────────────
export const OAuthProvider = {
  GOOGLE: 'google',
  GITHUB: 'github',
} as const

export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider]
