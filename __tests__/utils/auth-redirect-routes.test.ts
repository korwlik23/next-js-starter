import { GET as RefreshGET } from '@/app/api/auth/refresh/route'
import { GET as LogoutGET } from '@/app/api/auth/logout/route'
import { GET as VerifyEmailGET } from '@/app/api/auth/verify-email/route'

// redirect ของ route ฝั่ง auth ต้องชี้ไปโดเมนจริง ไม่ใช่ host ภายใน container (0.0.0.0:3000)
const INTERNAL = 'https://0.0.0.0:3000'

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL | string, status = 307) => ({
      status,
      headers: new Headers({ location: String(url) }),
    }),
    json: (body: unknown, init?: ResponseInit) => ({ status: init?.status ?? 200, body }),
  },
}))
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: jest.fn(), delete: jest.fn() }),
}))
jest.mock('@/config/app.config', () => ({ appConfig: { url: 'https://app.example.com' } }))
jest.mock('@/modules/auth/service', () => ({
  refreshTokenService: jest.fn(),
  logoutService: jest.fn(),
  verifyEmailService: jest.fn().mockRejectedValue(new Error('invalid')),
}))
jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockResolvedValue(null),
  clearAuthCookies: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/i18n/server', () => ({
  getLocaleFromRequest: () => 'en',
  translate: (_l: string, k: string) => k,
}))

function MakeRequest(path: string) {
  const url = new URL(path, INTERNAL)
  return { url: url.toString(), nextUrl: url, headers: new Headers() } as any
}

describe('auth redirect routes in production', () => {
  beforeEach(() => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' })
  })
  afterEach(() => jest.restoreAllMocks())

  it('GET /api/auth/refresh without a refresh token redirects to the public /login', async () => {
    const res = await RefreshGET(MakeRequest('/api/auth/refresh?callbackUrl=%2Fdashboard'))
    expect(res.headers.get('location')).toBe('https://app.example.com/login')
  })

  it('GET /api/auth/logout redirects to the public /login', async () => {
    const res = await LogoutGET(MakeRequest('/api/auth/logout'))
    expect(res.headers.get('location')).toBe('https://app.example.com/login')
  })

  it('GET /api/auth/verify-email with a bad token redirects to the public login error page', async () => {
    const res = await VerifyEmailGET(MakeRequest('/api/auth/verify-email?token=bad'))
    expect(res.headers.get('location')).toBe('https://app.example.com/login?error=verification')
  })
})
