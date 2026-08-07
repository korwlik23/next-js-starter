import { HealthService } from '@/modules/health/service'
import { GET } from '@/app/api/health/route'
import { GET as GETVersionedHealth } from '@/app/api/v1/internal/health/route'

jest.mock('@/modules/health/service', () => ({
  HealthService: {
    checkSystemHealth: jest.fn(),
  },
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    }),
  },
}))

const checkSystemHealth = jest.mocked(HealthService.checkSystemHealth)
const getHealth = GET as (request: Request) => Promise<Response>
const getVersionedHealth = GETVersionedHealth as (request: Request) => Promise<Response>
const originalHealthCheckToken = process.env.HEALTH_CHECK_TOKEN

function requestWithId(requestId: string, headers: Record<string, string> = {}, url = '/api/health') {
  return {
    url,
    headers: new Headers({ 'X-Request-Id': requestId, ...headers }),
  } as Request
}

describe('health route contract', () => {
  beforeEach(() => {
    checkSystemHealth.mockReset()
    delete process.env.HEALTH_CHECK_TOKEN
  })

  afterEach(() => {
    if (originalHealthCheckToken === undefined) {
      delete process.env.HEALTH_CHECK_TOKEN
    } else {
      process.env.HEALTH_CHECK_TOKEN = originalHealthCheckToken
    }
  })

  it('returns ok with a 200 status when every check passes and the token gate is disabled', async () => {
    process.env.HEALTH_CHECK_TOKEN = ''
    checkSystemHealth.mockResolvedValue({
      timestamp: '2026-08-07T00:00:00.000Z',
      env_db: true,
      env_jwt: true,
      db_connected: true,
      bcrypt_works: true,
    })

    const response = await getHealth(requestWithId('health-ok-123'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Request-Id')).toBe('health-ok-123')
    expect(body).toMatchObject({
      success: true,
      data: { status: 'ok' },
      meta: { request_id: 'health-ok-123' },
    })
  })

  it('returns degraded with a 503 status when a dependency check fails', async () => {
    checkSystemHealth.mockResolvedValue({
      timestamp: '2026-08-07T00:00:00.000Z',
      env_db: true,
      env_jwt: true,
      db_connected: false,
      bcrypt_works: true,
    })

    const response = await getHealth(requestWithId('health-degraded-123'))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('X-Request-Id')).toBe('health-degraded-123')
    expect(body).toMatchObject({
      success: true,
      data: { status: 'degraded', db_connected: false },
      meta: { request_id: 'health-degraded-123' },
    })
  })

  it('rejects a missing or incorrect token before running health checks', async () => {
    process.env.HEALTH_CHECK_TOKEN = 'health-secret'
    checkSystemHealth.mockResolvedValue({
      env_db: true,
      env_jwt: true,
      db_connected: true,
      bcrypt_works: true,
    })

    const missingTokenResponse = await getHealth(requestWithId('health-missing-token-123'))
    const wrongTokenResponse = await getHealth(
      requestWithId('health-wrong-token-123', { 'X-Health-Token': 'wrong-secret' })
    )

    expect(missingTokenResponse.status).toBe(401)
    expect(wrongTokenResponse.status).toBe(401)
    expect(missingTokenResponse.headers.get('X-Request-Id')).toBe('health-missing-token-123')
    expect(wrongTokenResponse.headers.get('X-Request-Id')).toBe('health-wrong-token-123')
    await expect(missingTokenResponse.json()).resolves.toMatchObject({
      success: false,
      code: 'AUTH_UNAUTHORIZED',
      meta: { request_id: 'health-missing-token-123' },
    })
    await expect(wrongTokenResponse.json()).resolves.toMatchObject({
      success: false,
      code: 'AUTH_UNAUTHORIZED',
      meta: { request_id: 'health-wrong-token-123' },
    })
    expect(checkSystemHealth).not.toHaveBeenCalled()
  })

  it('accepts the standard header on both health routes', async () => {
    process.env.HEALTH_CHECK_TOKEN = 'health-secret'
    checkSystemHealth.mockResolvedValue({
      timestamp: '2026-08-07T00:00:00.000Z',
      env_db: true,
      env_jwt: true,
      db_connected: true,
      bcrypt_works: true,
    })

    const directResponse = await getHealth(
      requestWithId('health-header-direct-123', { 'X-Health-Token': 'health-secret' })
    )
    const versionedResponse = await getVersionedHealth(
      requestWithId('health-header-versioned-123', { 'X-Health-Token': 'health-secret' }, '/api/v1/internal/health')
    )

    expect(directResponse.status).toBe(200)
    expect(versionedResponse.status).toBe(200)
    expect(directResponse.headers.get('X-Request-Id')).toBe('health-header-direct-123')
    expect(versionedResponse.headers.get('X-Request-Id')).toBe('health-header-versioned-123')
    expect(checkSystemHealth).toHaveBeenCalledTimes(2)
  })

  it('does not accept a query token on the versioned route', async () => {
    process.env.HEALTH_CHECK_TOKEN = 'health-secret'
    checkSystemHealth.mockResolvedValue({
      env_db: true,
      env_jwt: true,
      db_connected: true,
      bcrypt_works: true,
    })

    const response = await getVersionedHealth(
      requestWithId(
        'health-query-token-123',
        {},
        '/api/v1/internal/health?token=health-secret'
      )
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('X-Request-Id')).toBe('health-query-token-123')
    expect(checkSystemHealth).not.toHaveBeenCalled()
  })
})
