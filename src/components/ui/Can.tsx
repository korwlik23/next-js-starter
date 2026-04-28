'use client'

import React from 'react'
import { useAuthStore } from '@/store/authStore'

interface CanProps {
  permission?: string
  role?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component สำหรับตรวจสอบสิทธิ์ในการแสดงผล UI
 * @example
 * <Can permission="user.create">
 *   <Button>Create User</Button>
 * </Can>
 */
export function Can({ permission, role, children, fallback = null }: CanProps) {
  const { hasPermission, hasRole, user } = useAuthStore()

  // ถ้าไม่มี user ถือว่าไม่มีสิทธิ์ใดๆ
  if (!user) return <>{fallback}</>

  let granted = false

  if (permission && role) {
    // ต้องมีทั้ง permission และ role
    granted = hasPermission(permission) && hasRole(role)
  } else if (permission) {
    // ตรวจสอบ permission อย่างเดียว
    granted = hasPermission(permission)
  } else if (role) {
    // ตรวจสอบ role อย่างเดียว
    granted = hasRole(role)
  } else {
    // ไม่ได้ส่งเงื่อนไขอะไรมา ถือว่าผ่าน
    granted = true
  }

  if (!granted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
