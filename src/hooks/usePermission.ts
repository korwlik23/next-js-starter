// ────────────────────────────────────────
// usePermission — hook สำหรับตรวจสอบสิทธิ์
// Wrapper รอบ useAuthStore เพื่อให้ใช้งานง่ายและเป็น dedicated API
// ────────────────────────────────────────

import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook สำหรับตรวจสอบสิทธิ์ของผู้ใช้ปัจจุบัน
 * @example
 * const { can, can_all, can_any, has_role } = UsePermission()
 * if (can('user.create')) { ... }
 */
export function UsePermission() {
  // ดึง function ตรวจสอบสิทธิ์จาก auth store
  const has_permission = useAuthStore((state) => state.hasPermission)
  const has_role_fn = useAuthStore((state) => state.hasRole)
  const user = useAuthStore((state) => state.user)

  // ตรวจสอบสิทธิ์เดี่ยว
  const can = useCallback(
    (permission: string): boolean => {
      return has_permission(permission)
    },
    [has_permission]
  )

  // ตรวจสอบว่ามีสิทธิ์ทุกข้อ
  const can_all = useCallback(
    (permissions: string[]): boolean => {
      return permissions.every((perm) => has_permission(perm))
    },
    [has_permission]
  )

  // ตรวจสอบว่ามีสิทธิ์อย่างน้อยหนึ่งข้อ
  const can_any = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((perm) => has_permission(perm))
    },
    [has_permission]
  )

  // ตรวจสอบ role
  const has_role = useCallback(
    (role: string): boolean => {
      return has_role_fn(role)
    },
    [has_role_fn]
  )

  // ตรวจสอบว่ามี role อย่างน้อยหนึ่ง role
  const has_any_role = useCallback(
    (roles: string[]): boolean => {
      return roles.some((r) => has_role_fn(r))
    },
    [has_role_fn]
  )

  return {
    /** ตรวจสอบสิทธิ์เดี่ยว (e.g. 'user.create') */
    can,
    /** ตรวจสอบว่ามีสิทธิ์ทุกข้อ */
    can_all,
    /** ตรวจสอบว่ามีสิทธิ์อย่างน้อยหนึ่งข้อ */
    can_any,
    /** ตรวจสอบ role เดี่ยว (e.g. 'admin') */
    has_role,
    /** ตรวจสอบว่ามี role อย่างน้อยหนึ่ง role */
    has_any_role,
    /** ข้อมูล user ปัจจุบัน */
    user,
    /** ผู้ใช้เข้าสู่ระบบแล้วหรือไม่ */
    is_authenticated: !!user,
  }
}
