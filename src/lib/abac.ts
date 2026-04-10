// ────────────────────────────────────────
// ABAC — Attribute-Based Access Control
// ตรวจสอบสิทธิ์ตาม attribute ของ resource
// ────────────────────────────────────────

import type { TokenPayload } from '@/types'
import { can } from '@/lib/permissions'

/**
 * ตรวจสอบว่าผู้ใช้เป็นเจ้าของ resource หรือไม่
 * @example CanAccessOwn(user, 'post.update', post.ownerId) → true ถ้า user เป็นเจ้าของ
 */
export function CanAccessOwn(
  user: TokenPayload | null,
  permission: string,
  resource_owner_id: string
): boolean {
  if (!user) return false

  // ถ้ามี permission ตรงๆ — อนุญาตเลย (admin/owner)
  if (can(user, permission)) return true

  // ตรวจสอบ ownership — ผู้ใช้เป็นเจ้าของ resource หรือไม่
  return user.sub === resource_owner_id
}

/**
 * ตรวจสอบว่าผู้ใช้อยู่ในกลุ่ม tenant เดียวกับ resource
 * ใช้ป้องกัน cross-tenant access
 */
export function CanAccessTenant(
  user: TokenPayload | null,
  resource_tenant_id: string | null
): boolean {
  if (!user) return false

  // ถ้า resource ไม่ผูก tenant — อนุญาต
  if (!resource_tenant_id) return true

  // ถ้าผู้ใช้ไม่มี tenant — ไม่อนุญาตเข้าถึง tenant resource
  if (!user.tenantId) return false

  return user.tenantId === resource_tenant_id
}

/**
 * ตรวจสอบสิทธิ์แบบ combined (RBAC + ABAC)
 * ต้องผ่านทั้ง permission check AND attribute check
 */
export function CanWithAttribute(
  user: TokenPayload | null,
  permission: string,
  attributes: {
    /** เจ้าของ resource */
    owner_id?: string
    /** tenant ของ resource */
    tenant_id?: string | null
    /** custom condition function */
    condition?: (user: TokenPayload) => boolean
  }
): boolean {
  if (!user) return false

  // 1. ตรวจ RBAC permission
  if (!can(user, permission)) {
    // ถ้าไม่มี permission — ตรวจ ownership เป็น fallback
    if (attributes.owner_id && user.sub === attributes.owner_id) {
      // เจ้าของ resource — อนุญาต
    } else {
      return false
    }
  }

  // 2. ตรวจ tenant isolation
  if (attributes.tenant_id !== undefined) {
    if (!CanAccessTenant(user, attributes.tenant_id)) return false
  }

  // 3. ตรวจ custom condition
  if (attributes.condition && !attributes.condition(user)) return false

  return true
}

/**
 * Field-level permission — ตรวจสอบว่าผู้ใช้สามารถแก้ไข field ที่ระบุได้หรือไม่
 * @example CanEditField(user, 'user', 'role') → false ถ้าไม่ใช่ admin
 */
export function CanEditField(
  user: TokenPayload | null,
  entity: string,
  field: string
): boolean {
  if (!user) return false

  // ตรวจสอบ field-level permission (e.g. 'user.edit.role')
  const field_permission = `${entity}.edit.${field}`
  return can(user, field_permission) || can(user, `${entity}.*`)
}
