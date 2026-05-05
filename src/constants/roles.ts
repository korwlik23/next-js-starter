// ─────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type RoleKey = (typeof ROLES)[keyof typeof ROLES]

// ─────────────────────────────────────────
// PERMISSIONS (dot notation: module.action)
// ─────────────────────────────────────────
export const PERMISSIONS = {
  // User module
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Role module
  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',

  // Audit
  AUDIT_VIEW: 'audit.view',

  // i18n
  TRANSLATION_MANAGE: 'translation.manage',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ─────────────────────────────────────────
// DEFAULT ROLE → PERMISSIONS MAP
// ─────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  owner: Object.values(PERMISSIONS) as PermissionKey[],
  admin: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
  member: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.USER_READ],
}
