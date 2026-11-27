import {
  ImpersonationService,
  ImpersonationForbiddenError,
} from '@/modules/auth/impersonation.service'
import prisma from '@/lib/prisma'
import { signAuthTokens } from '@/lib/jwt'
import { CreateAuditLog } from '@/lib/audit'

jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn() },
}))
jest.mock('@/lib/jwt', () => ({
  signAuthTokens: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
}))
// auth/service ลาก email.service → queue → @upstash/redis (ESM) เข้ามา ซึ่ง jest parse ไม่ได้
jest.mock('@/services/email.service', () => ({ EmailService: {} }))
jest.mock('@/lib/audit', () => ({ CreateAuditLog: jest.fn().mockResolvedValue(undefined) }))

const audit_mock = CreateAuditLog as jest.Mock

const TENANT_ACME = 'tenant-acme'
const TENANT_OTHER = 'tenant-other'
const SUPPORT_PERMS = ['admin.access', 'admin.impersonate', 'user.read']

/** สร้าง user ในรูปเดียวกับที่ GetUserWithPermissions คืน (role ผูกกับ tenant ของผู้ใช้) */
function MakeUser(id: string, tenant_id: string | null, permission_names: string[]) {
  return {
    id,
    email: `${id}@example.com`,
    name: id,
    tenantId: tenant_id,
    roles: [
      {
        tenantId: tenant_id,
        role: {
          name: `${id}-role`,
          tenantId: tenant_id,
          permissions: permission_names.map((name) => ({ permission: { name } })),
        },
      },
    ],
  }
}

function MockUsers(...users: ReturnType<typeof MakeUser>[]) {
  ;(prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) =>
    Promise.resolve(users.find((u) => u.id === where.id) ?? null)
  )
}

describe('ImpersonationService.StartImpersonation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('allows a tenant admin to impersonate a less-privileged user in the same tenant', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('acme-member', TENANT_ACME, ['user.read'])
    )

    const { user } = await ImpersonationService.StartImpersonation('acme-admin', 'acme-member')

    expect(user.sub).toBe('acme-member')
    expect(user.impersonatorId).toBe('acme-admin')
    expect(signAuthTokens).toHaveBeenCalledTimes(1)
  })

  it('rejects a tenant admin impersonating a user in another tenant', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('other-member', TENANT_OTHER, ['user.read'])
    )

    await expect(
      ImpersonationService.StartImpersonation('acme-admin', 'other-member')
    ).rejects.toBeInstanceOf(ImpersonationForbiddenError)
    expect(signAuthTokens).not.toHaveBeenCalled()
  })

  it('rejects a tenant admin impersonating a platform user (tenantId null)', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('platform-owner', null, [...SUPPORT_PERMS, 'role.delete', 'billing.manage'])
    )

    await expect(
      ImpersonationService.StartImpersonation('acme-admin', 'platform-owner')
    ).rejects.toThrow()
    expect(signAuthTokens).not.toHaveBeenCalled()
  })

  it('rejects impersonating a same-tenant user who holds permissions the caller lacks', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('acme-owner', TENANT_ACME, [...SUPPORT_PERMS, 'billing.manage'])
    )

    await expect(
      ImpersonationService.StartImpersonation('acme-admin', 'acme-owner')
    ).rejects.toThrow()
    expect(signAuthTokens).not.toHaveBeenCalled()
  })

  it('rejects impersonating yourself', async () => {
    MockUsers(MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS))

    await expect(
      ImpersonationService.StartImpersonation('acme-admin', 'acme-admin')
    ).rejects.toThrow()
    expect(signAuthTokens).not.toHaveBeenCalled()
  })

  it('allows a platform user to impersonate a less-privileged user in any tenant', async () => {
    MockUsers(
      MakeUser('platform-owner', null, [...SUPPORT_PERMS, 'billing.manage']),
      MakeUser('acme-member', TENANT_ACME, ['user.read'])
    )

    const { user } = await ImpersonationService.StartImpersonation('platform-owner', 'acme-member')

    expect(user.sub).toBe('acme-member')
    expect(user.impersonatorId).toBe('platform-owner')
  })

  it('rejects a caller without admin.impersonate', async () => {
    MockUsers(
      MakeUser('acme-member', TENANT_ACME, ['user.read']),
      MakeUser('acme-other', TENANT_ACME, ['user.read'])
    )

    await expect(
      ImpersonationService.StartImpersonation('acme-member', 'acme-other')
    ).rejects.toThrow()
    expect(signAuthTokens).not.toHaveBeenCalled()
  })
})

describe('ImpersonationService audit trail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('records ADMIN_IMPERSONATION_STARTED with actor, target and target tenant', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('acme-member', TENANT_ACME, ['user.read'])
    )

    await ImpersonationService.StartImpersonation('acme-admin', 'acme-member')

    expect(audit_mock).toHaveBeenCalledTimes(1)
    expect(audit_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_IMPERSONATION_STARTED',
        userId: 'acme-admin',
        tenantId: TENANT_ACME,
        entity: 'User',
        entityId: 'acme-member',
      })
    )
  })

  it('records ADMIN_IMPERSONATION_DENIED when the guard rejects the request', async () => {
    MockUsers(
      MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS),
      MakeUser('platform-owner', null, [...SUPPORT_PERMS, 'billing.manage'])
    )

    await expect(
      ImpersonationService.StartImpersonation('acme-admin', 'platform-owner')
    ).rejects.toThrow()

    expect(audit_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_IMPERSONATION_DENIED',
        userId: 'acme-admin',
        tenantId: TENANT_ACME,
        entity: 'User',
        entityId: 'platform-owner',
        metadata: expect.objectContaining({ reason: expect.any(String) }),
      })
    )
  })

  it('records ADMIN_IMPERSONATION_STOPPED with the impersonated user', async () => {
    MockUsers(MakeUser('acme-admin', TENANT_ACME, SUPPORT_PERMS))

    await ImpersonationService.StopImpersonation('acme-admin', 'acme-member')

    expect(audit_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_IMPERSONATION_STOPPED',
        userId: 'acme-admin',
        tenantId: TENANT_ACME,
        entity: 'User',
        entityId: 'acme-member',
      })
    )
  })
})
