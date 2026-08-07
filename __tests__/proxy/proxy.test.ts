import { proxy } from '@/proxy'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { checkRateLimit } from '@/utils/rate-limit'

jest.mock('@/config', () => ({
  authConfig: {
    publicRoutes: [],
    cookieName: {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    },
  },
}))

jest.mock('@/lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}))

jest.mock('@/utils/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    }),
    next: jest.fn(),
    redirect: jest.fn(),
  },
}))

const mockedVerifyAccessToken = jest.mocked(verifyAccessToken)
const mockedVerifyRefreshToken = jest.mocked(verifyRefreshToken)
const mockedCheckRateLimit = jest.mocked(checkRateLimit)

function makeRequest(pathname: string, requestId: string, cookies: Record<string, string> = {}) {
  return {
    url: `http://localhost${pathname}`,
    nextUrl: { pathname, search: '' },
    headers: new Headers({ 'X-Request-Id': requestId }),
    cookies: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
    },
  } as never
}

describe('proxy API response contract', () => {
  beforeEach(() => {
    mockedVerifyAccessToken.mockResolvedValue(null)
    mockedVerifyRefreshToken.mockResolvedValue(null)
    mockedCheckRateLimit.mockResolvedValue({
      success: true,
      limited: false,
      limit: 100,
      remaining: 99,
      reset: 0,
    })
  })

  it('returns a correlated 401 envelope for unauthenticated API requests', async () => {
    const response = await proxy(makeRequest('/api/private', 'proxy-401-123'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('X-Request-Id')).toBe('proxy-401-123')
    expect(body).toMatchObject({
      success: false,
      code: 'AUTH_UNAUTHORIZED',
      meta: { request_id: 'proxy-401-123' },
    })
  })
})
