'use client'

import { useAuthStore } from '@/store/authStore'

// ────────────────────────────────────────
// Can — Permission Guard Component
// แสดง children เฉพาะเมื่อ user มีสิทธิ์ที่กำหนด
//
// ตัวอย่างการใช้งาน:
// <Can permission="user.create">
//   <Button>Create User</Button>
// </Can>
// ────────────────────────────────────────

interface CanProps {
  /** permission ที่ต้องตรวจสอบ (dot notation เช่น "user.create") */
  permission: string
  /** แสดงเนื้อหานี้แทนถ้าไม่มีสิทธิ์ */
  fallback?: React.ReactNode
  /** เนื้อหาที่จะแสดงถ้ามีสิทธิ์ */
  children: React.ReactNode
}

export function Can({ permission, fallback = null, children }: CanProps) {
  const has_permission = useAuthStore((state) => state.hasPermission)

  // ตรวจสอบสิทธิ์ — ถ้าไม่ผ่านแสดง fallback แทน
  if (!has_permission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ────────────────────────────────────────
// CanAny — แสดงเมื่อมีสิทธิ์อย่างน้อยหนึ่งใน permissions
// ────────────────────────────────────────
interface CanAnyProps {
  /** รายการ permissions (ต้องมีอย่างน้อย 1 ข้อ) */
  permissions: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function CanAny({ permissions, fallback = null, children }: CanAnyProps) {
  const has_permission = useAuthStore((state) => state.hasPermission)

  const is_allowed = permissions.some((perm) => has_permission(perm))

  if (!is_allowed) return <>{fallback}</>
  return <>{children}</>
}

// ────────────────────────────────────────
// CanAll — แสดงเมื่อมีสิทธิ์ทุกข้อใน permissions
// ────────────────────────────────────────
interface CanAllProps {
  permissions: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function CanAll({ permissions, fallback = null, children }: CanAllProps) {
  const has_permission = useAuthStore((state) => state.hasPermission)

  const is_allowed = permissions.every((perm) => has_permission(perm))

  if (!is_allowed) return <>{fallback}</>
  return <>{children}</>
}
