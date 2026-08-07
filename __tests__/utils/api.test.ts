import {
  badRequest,
  errorResponse,
  forbidden,
  paginatedResponse,
  successResponse,
  unauthorized,
  unprocessableEntity,
} from '@/utils/api'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const response = {
        status: init?.status ?? 200,
        headers: new Headers(init?.headers),
        json: async () => body,
      }

      return response
    },
  },
}))

describe('API response helpers', () => {
  it('returns a consistent success envelope', async () => {
    const response = successResponse({ id: 'user_1' }, 'Loaded', 200, 'success-123')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Request-Id')).toBe('success-123')
    expect(response.headers.get('X-Trace-Id')).toBe('success-123')
    expect(body).toEqual({
      success: true,
      data: { id: 'user_1' },
      message: 'Loaded',
      meta: { request_id: 'success-123' },
    })
  })

  it('keeps generated correlation ids identical across the header and body', async () => {
    const response = successResponse({ id: 'user_2' })
    const body = await response.json()
    const requestId = response.headers.get('X-Request-Id')

    expect(requestId).toBeTruthy()
    expect(body.meta.request_id).toBe(requestId)
    expect(response.headers.get('X-Trace-Id')).toBe(requestId)
  })

  it('includes correlation metadata in paginated responses', async () => {
    const response = paginatedResponse(
      [{ id: 'user_1' }],
      { total: 3, page: 1, limit: 1 },
      'page-123'
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.meta).toEqual({
      total: 3,
      page: 1,
      limit: 1,
      totalPages: 3,
      request_id: 'page-123',
    })
    expect(response.headers.get('X-Request-Id')).toBe('page-123')
  })

  it('keeps backwards-compatible validation error arguments', async () => {
    const response = badRequest(
      'Invalid input',
      {
        email: ['Email is required'],
      },
      undefined,
      'validation-123'
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get('X-Request-Id')).toBe('validation-123')
    expect(body).toEqual({
      success: false,
      message: 'Invalid input',
      code: 'REQ_BAD_REQUEST',
      errors: {
        email: ['Email is required'],
      },
      meta: { request_id: 'validation-123' },
    })
  })

  it('supports explicit error codes with field errors', async () => {
    const response = errorResponse(
      'Invalid input',
      422,
      'VALIDATION_ERROR',
      {
        password: ['Password is too short'],
      },
      'error-422'
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(response.headers.get('X-Request-Id')).toBe('error-422')
    expect(body).toEqual({
      success: false,
      message: 'Invalid input',
      code: 'VALIDATION_ERROR',
      errors: {
        password: ['Password is too short'],
      },
      meta: { request_id: 'error-422' },
    })
  })

  it('uses standard codes and correlation metadata for auth failures', async () => {
    const unauthorizedResponse = unauthorized('Login required', undefined, 'unauthorized-401')
    const forbiddenResponse = forbidden('Access denied', undefined, 'forbidden-403')

    expect(unauthorizedResponse.status).toBe(401)
    expect(unauthorizedResponse.headers.get('X-Request-Id')).toBe('unauthorized-401')
    await expect(unauthorizedResponse.json()).resolves.toMatchObject({
      success: false,
      code: 'AUTH_UNAUTHORIZED',
      meta: { request_id: 'unauthorized-401' },
    })

    expect(forbiddenResponse.status).toBe(403)
    expect(forbiddenResponse.headers.get('X-Request-Id')).toBe('forbidden-403')
    await expect(forbiddenResponse.json()).resolves.toMatchObject({
      success: false,
      code: 'AUTH_FORBIDDEN',
      meta: { request_id: 'forbidden-403' },
    })
  })

  it('returns a standard 422 validation response with field errors', async () => {
    const response = unprocessableEntity(
      'Validation failed',
      {
        email: ['Email is required'],
      },
      undefined,
      'validation-422'
    )

    expect(response.status).toBe(422)
    expect(response.headers.get('X-Request-Id')).toBe('validation-422')
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Validation failed',
      code: 'REQ_VALIDATION_ERROR',
      errors: { email: ['Email is required'] },
      meta: { request_id: 'validation-422' },
    })
  })
})
