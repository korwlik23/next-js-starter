import { starterCapabilities } from '@/config'

const baselineKeys = [
  'auth_session',
  'rbac_permissions',
  'settings',
  'localization',
  'notifications',
  'audit_log',
  'health_operations',
  'ui_components',
  'api_contract',
  'ci_test_gates',
] as const

describe('starter capability contract', () => {
  it('exposes the shared enabled baseline contract', () => {
    expect(starterCapabilities.schema_version).toBe(1)
    expect(starterCapabilities.starter).toBe('next')
    expect(Object.keys(starterCapabilities.baseline)).toEqual(baselineKeys)

    for (const key of baselineKeys) {
      expect(starterCapabilities.baseline[key]).toEqual({ enabled: true, status: 'enabled' })
    }
  })

  it('exposes optional flags that match the Next feature matrix', () => {
    expect(starterCapabilities.optional).toEqual({
      tenant_isolation: { enabled: true, status: 'enabled' },
      billing_subscriptions: { enabled: true, status: 'enabled' },
      support: { enabled: false, status: 'disabled' },
      attachments: { enabled: true, status: 'enabled' },
      mfa_oauth: { enabled: true, status: 'enabled' },
      modules_feature_flags: { enabled: true, status: 'enabled' },
      jobs_queues: { enabled: true, status: 'enabled' },
    })
  })
})
