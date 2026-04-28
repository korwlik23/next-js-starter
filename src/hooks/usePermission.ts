import { useAuthStore } from '@/store/authStore'

/**
 * Hook สำหรับตรวจสอบสิทธิ์แบบสั้น
 * @example
 * const { can, isRole } = usePermission()
 * if (can('user.create')) { ... }
 */
export function usePermission() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const hasRole = useAuthStore((s) => s.hasRole)
  const user = useAuthStore((s) => s.user)

  return {
    can: hasPermission,
    isRole: hasRole,
    user,
  }
}
