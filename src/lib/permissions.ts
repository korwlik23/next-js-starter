import type { TokenPayload } from '@/types'
import type { PermissionKey } from '@/constants'

// ─────────────────────────────────────────
// CORE PERMISSION CHECK
// ─────────────────────────────────────────

/**
 * Check if user has a specific permission
 *
 * ใช้การเทียบแบบตรงตัวเท่านั้น — ไม่รองรับ wildcard โดยเจตนา
 *
 * เหตุผล: wildcard (`user.*` หรือ `*`) ทำให้ permission ที่เพิ่มใหม่ในโมดูล
 * ถูก grant ให้ผู้ถืออยู่แล้วโดยอัตโนมัติ ซึ่งเป็นช่องทาง privilege escalation
 * ที่มองไม่เห็นตอน review และทำให้ตอบไม่ได้ว่า "ใครมีสิทธิ์อะไรบ้าง"
 *
 * role ที่ต้องการสิทธิ์ครบให้ระบุรายการจริงผ่าน `ROLE_PERMISSIONS`
 * (ดู `owner` ใน `@/constants/roles` ที่ใช้ `Object.values(PERMISSIONS)`)
 */
export function can(
  user: TokenPayload | null | undefined,
  permission: PermissionKey | string
): boolean {
  if (!user) return false

  return (user.permissions ?? []).includes(permission)
}

/**
 * Check if user has ALL of the given permissions
 */
export function canAll(user: TokenPayload | null, permissions: string[]): boolean {
  return permissions.every((p) => can(user, p))
}

/**
 * Check if user has ANY of the given permissions
 */
export function canAny(user: TokenPayload | null, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p))
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: TokenPayload | null, role: string): boolean {
  if (!user) return false
  return (user.roles ?? []).includes(role)
}
