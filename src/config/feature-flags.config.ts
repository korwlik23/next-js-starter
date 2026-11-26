export const features = {
  multiTenant: true, // เปิดใช้งานตามแผน Phase 1.3
  registration: true,
  forgotPassword: true,
  darkMode: true,
  i18n: true,
  devTools: process.env.NODE_ENV === 'development',
  trialSystem: true,
  apiKeys: true,
  analytics: true,
  auditLog: true,
  sso: false,
} as const

export const starterCapabilities = {
  schema_version: 1,
  starter: 'next',
  baseline: {
    auth_session: { enabled: true, status: 'enabled' },
    rbac_permissions: { enabled: true, status: 'enabled' },
    settings: { enabled: true, status: 'enabled' },
    localization: { enabled: true, status: 'enabled' },
    notifications: { enabled: true, status: 'enabled' },
    audit_log: { enabled: true, status: 'enabled' },
    health_operations: { enabled: true, status: 'enabled' },
    ui_components: { enabled: true, status: 'enabled' },
    api_contract: { enabled: true, status: 'enabled' },
    ci_test_gates: { enabled: true, status: 'enabled' },
  },
  optional: {
    tenant_isolation: { enabled: true, status: 'enabled' },
    billing_subscriptions: { enabled: true, status: 'enabled' },
    support: { enabled: false, status: 'disabled' },
    attachments: { enabled: true, status: 'enabled' },
    mfa_oauth: { enabled: true, status: 'enabled' },
    modules_feature_flags: { enabled: true, status: 'enabled' },
    jobs_queues: { enabled: true, status: 'enabled' },
  },
} as const
