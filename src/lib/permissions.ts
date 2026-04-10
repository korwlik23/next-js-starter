import type { TokenPayload } from '@/types'
import type { PermissionKey } from '@/constants'

// ─────────────────────────────────────────
// CORE PERMISSION CHECK
// ─────────────────────────────────────────

/**
 * Check if user has a specific permission
 * Supports wildcard: "user.*" matches "user.create", "user.read", etc.
 */
export function can(
  user: TokenPayload | null | undefined,
  permission: PermissionKey | string
): boolean {
  if (!user) return false

  const userPermissions = user.permissions ?? []

  // Direct match
  if (userPermissions.includes(permission)) return true

  // Wildcard match: e.g. "user.*" covers any "user.something"
  const [module] = permission.split('.')
  if (userPermissions.includes(`${module}.*`)) return true

  // Owner wildcard: "*" covers everything
  if (userPermissions.includes('*')) return true

  return false
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
