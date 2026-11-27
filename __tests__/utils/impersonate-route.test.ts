import { POST } from '@/app/api/v1/admin/impersonate/route'
import {
  ImpersonationService,
  ImpersonationForbiddenError,
} from '@/modules/auth/impersonation.service'
import { verifyAccessToken } from '@/lib/jwt'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      cookies: { set: jest.fn() },
      json: async () => body,
    }),
  },
}))
jest.mock('@/lib/jwt', () => ({ verifyAccessToken: jest.fn() }))
jest.mock('@/i18n/server', () => ({
  getLocaleFromRequest: () => 'en',
  translate: (_locale: string, key: string) => key,
}))
jest.mock('@/modules/auth/impersonation.service', () => {
  const actual = jest.requireActual('@/modules/auth/impersonation.service')
  return {
    ImpersonationForbiddenError: actual.ImpersonationForbiddenError,
    ImpersonationService: { StartImpersonation: jest.fn(), StopImpersonation: jest.fn() },
  }
})
// impersonation.service → auth/service → email.service → @upstash/redis (ESM) ที่ jest parse ไม่ได้
jest.mock('@/services/email.service', () => ({ EmailService: {} }))
jest.mock('@/lib/prisma', () => ({}))

const start_mock = jest.mocked(ImpersonationService.StartImpersonation)
const verify_mock = jest.mocked(verifyAccessToken)

function MakeRequest(body: unknown) {
  return {
    cookies: { get: () => ({ value: 'access-token' }) },
    headers: new Headers(),
    json: async () => body,
  } as any
}

describe('POST /api/v1/admin/impersonate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    verify_mock.mockResolvedValue({
      sub: 'acme-admin',
      email: 'a@example.com',
      name: 'a',
      roles: ['admin'],
      permissions: ['admin.impersonate'],
      tenantId: 'tenant-acme',
    } as any)
  })

  it('returns 403 when the service refuses the impersonation', async () => {
    start_mock.mockRejectedValue(new ImpersonationForbiddenError('cross_tenant'))

    const res = await POST(MakeRequest({ target_user_id: 'platform-owner' }))

    expect(res.status).toBe(403)
  })

  it('returns 403 when the caller lacks admin.impersonate', async () => {
    verify_mock.mockResolvedValue({
      sub: 'acme-member',
      permissions: ['user.read'],
      tenantId: 'tenant-acme',
    } as any)

    const res = await POST(MakeRequest({ target_user_id: 'acme-other' }))

    expect(res.status).toBe(403)
    expect(start_mock).not.toHaveBeenCalled()
  })

  it('keeps 400 for other service errors such as an unknown target', async () => {
    start_mock.mockRejectedValue(new Error('not found'))

    const res = await POST(MakeRequest({ target_user_id: 'missing' }))

    expect(res.status).toBe(400)
  })
})
