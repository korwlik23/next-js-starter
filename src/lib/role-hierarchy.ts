// ────────────────────────────────────────
// Role Hierarchy — ลำดับชั้นของ Role
// owner > admin > member
// role ที่สูงกว่ารวม permission ของ role ที่ต่ำกว่าทั้งหมด
// ────────────────────────────────────────

import { ROLES } from '@/constants'
import type { TokenPayload } from '@/types'

/**
 * กำหนดลำดับชั้นของ role — ค่ายิ่งสูง = อำนาจยิ่งมาก
 */
const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 50,
  [ROLES.MEMBER]: 10,
}

/**
 * ดึงระดับของ role
 */
export function GetRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] ?? 0
}

/**
 * ดึง role ที่มีระดับสูงสุดจากรายการ roles
 * @example GetHighestRole(['member', 'admin']) → 'admin'
 */
export function GetHighestRole(roles: string[]): string | null {
  if (roles.length === 0) return null

  return roles.reduce((highest, current) => {
    return GetRoleLevel(current) > GetRoleLevel(highest) ? current : highest
  })
}

/**
 * ตรวจสอบว่า role A มีระดับสูงกว่าหรือเท่ากับ role B หรือไม่
 * @example IsRoleAboveOrEqual('admin', 'member') → true
 */
export function IsRoleAboveOrEqual(role_a: string, role_b: string): boolean {
  return GetRoleLevel(role_a) >= GetRoleLevel(role_b)
}

/**
 * ตรวจสอบว่า role A มีระดับสูงกว่า role B อย่างเคร่งครัด (ไม่รวมเท่ากัน)
 * @example IsRoleAbove('owner', 'admin') → true
 */
export function IsRoleAbove(role_a: string, role_b: string): boolean {
  return GetRoleLevel(role_a) > GetRoleLevel(role_b)
}

/**
 * ตรวจสอบว่าผู้ใช้จัดการ target role ได้หรือไม่
 * (ต้องมี role ที่สูงกว่า target role เท่านั้น)
 * @example CanManageRole(user, 'member') → true ถ้า user เป็น admin/owner
 */
export function CanManageRole(user: TokenPayload | null, target_role: string): boolean {
  if (!user) return false

  const user_roles = user.roles ?? []
  const highest_role = GetHighestRole(user_roles)

  if (!highest_role) return false

  // ต้อง strictly above — ไม่อนุญาตให้ role เท่ากัน manage กัน
  return IsRoleAbove(highest_role, target_role)
}

/**
 * ดึงรายการ roles ที่ผู้ใช้สามารถ assign ให้คนอื่นได้
 * (roles ที่ต่ำกว่า role สูงสุดของตัวเอง)
 */
export function GetAssignableRoles(user: TokenPayload | null): string[] {
  if (!user) return []

  const user_highest = GetHighestRole(user.roles ?? [])
  if (!user_highest) return []

  const highest_level = GetRoleLevel(user_highest)

  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < highest_level)
    .map(([role]) => role)
    .sort((a, b) => GetRoleLevel(b) - GetRoleLevel(a))
}

/**
 * ดึงรายการ roles ทั้งหมดเรียงจากสูงไปต่ำ
 */
export function GetAllRolesSorted(): { name: string; level: number }[] {
  return Object.entries(ROLE_HIERARCHY)
    .map(([name, level]) => ({ name, level }))
    .sort((a, b) => b.level - a.level)
}
