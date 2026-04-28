export type PlanType = 'free' | 'pro' | 'enterprise'

// ─── LIMIT DEFINITIONS ───
export const PLAN_LIMITS = {
  free: {
    maxUsers: 3,
    maxProjects: 1,
    features: ['basic_analytics'],
  },
  pro: {
    maxUsers: 10,
    maxProjects: 10,
    features: ['basic_analytics', 'advanced_analytics', 'custom_domain'],
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxProjects: -1, // Unlimited
    features: ['basic_analytics', 'advanced_analytics', 'custom_domain', 'sso', 'audit_log'],
  },
} as const

// ─── UTILITY FUNCTIONS ───

/**
 * ตรวจสอบว่า Plan ปัจจุบันมีสิทธิ์ใช้งาน Feature นี้หรือไม่
 */
export function hasFeature(plan: PlanType, feature: string): boolean {
  return (PLAN_LIMITS[plan]?.features as readonly string[]).includes(feature) ?? false
}

/**
 * ตรวจสอบว่าจำนวนที่มีอยู่เกิน Limit ของ Plan หรือไม่
 * @param current จำนวนที่ใช้ไปแล้ว
 * @param limit จำนวนลิมิต (-1 คือไม่จำกัด)
 */
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true
  return current < limit
}

/**
 * ตัวอย่างการตรวจสอบสิทธิ์ว่าสามารถเชิญผู้ใช้เพิ่มได้หรือไม่
 */
export function canInviteMoreUsers(plan: PlanType, currentUserCount: number): boolean {
  const limit = PLAN_LIMITS[plan]?.maxUsers ?? 0
  return isWithinLimit(currentUserCount, limit)
}
