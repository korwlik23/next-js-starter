// ────────────────────────────────────────
// Feature Gate — ระบบจำกัด feature ตาม plan
// ใช้ตรวจสอบว่า tenant สามารถเข้าถึง feature ได้หรือไม่
// ────────────────────────────────────────

import { PLANS } from '@/constants'

// ─── ประเภท Feature ที่ระบบรองรับ
export const FEATURES = {
  MAX_USERS: 'max_users',
  MAX_PROJECTS: 'max_projects',
  CUSTOM_DOMAIN: 'custom_domain',
  API_ACCESS: 'api_access',
  AUDIT_LOG: 'audit_log',
  SSO: 'sso',
  ANALYTICS: 'analytics',
  PRIORITY_SUPPORT: 'priority_support',
  FILE_UPLOAD_SIZE_MB: 'file_upload_size_mb',
  WEBHOOK: 'webhook',
} as const

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES]

// ─── กำหนด limits ของแต่ละ plan
interface PlanLimits {
  /** จำนวนสมาชิกสูงสุด */
  max_users: number
  /** จำนวน projects สูงสุด */
  max_projects: number
  /** อนุญาต custom domain */
  custom_domain: boolean
  /** อนุญาตเข้าถึง API */
  api_access: boolean
  /** อนุญาตดู audit log */
  audit_log: boolean
  /** อนุญาต SSO */
  sso: boolean
  /** อนุญาต analytics */
  analytics: boolean
  /** อนุญาต priority support */
  priority_support: boolean
  /** ขนาดไฟล์อัปโหลดสูงสุด (MB) */
  file_upload_size_mb: number
  /** อนุญาต webhook */
  webhook: boolean
}

// ─── Plan → Feature Map
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  [PLANS.FREE]: {
    max_users: 3,
    max_projects: 5,
    custom_domain: false,
    api_access: false,
    audit_log: false,
    sso: false,
    analytics: false,
    priority_support: false,
    file_upload_size_mb: 10,
    webhook: false,
  },
  [PLANS.PRO]: {
    max_users: 20,
    max_projects: 50,
    custom_domain: true,
    api_access: true,
    audit_log: true,
    sso: false,
    analytics: true,
    priority_support: false,
    file_upload_size_mb: 100,
    webhook: true,
  },
  [PLANS.ENTERPRISE]: {
    max_users: Infinity,
    max_projects: Infinity,
    custom_domain: true,
    api_access: true,
    audit_log: true,
    sso: true,
    analytics: true,
    priority_support: true,
    file_upload_size_mb: 500,
    webhook: true,
  },
}

/**
 * ตรวจสอบว่า plan นี้สามารถเข้าถึง feature ได้หรือไม่
 * @example CanAccessFeature('free', 'api_access') → false
 */
export function CanAccessFeature(plan: string, feature: FeatureKey): boolean {
  const limits = PLAN_LIMITS[plan]
  if (!limits) return false

  const value = limits[feature]
  // สำหรับ boolean feature — return ตรงๆ
  if (typeof value === 'boolean') return value
  // สำหรับ numeric feature — ถ้ามากกว่า 0 ถือว่าเข้าถึงได้
  if (typeof value === 'number') return value > 0
  return false
}

/**
 * ดึงค่า limit ของ feature ตาม plan
 * @example GetFeatureLimit('pro', 'max_users') → 20
 */
export function GetFeatureLimit(plan: string, feature: FeatureKey): number | boolean {
  const limits = PLAN_LIMITS[plan]
  if (!limits) return false
  return limits[feature]
}

/**
 * ตรวจสอบว่า usage ปัจจุบันเกิน limit หรือไม่
 * @example IsOverLimit('free', 'max_users', 5) → true (limit = 3)
 */
export function IsOverLimit(plan: string, feature: FeatureKey, current_usage: number): boolean {
  const limit = GetFeatureLimit(plan, feature)
  if (typeof limit !== 'number') return false
  return current_usage >= limit
}
