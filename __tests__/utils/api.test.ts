import { badRequest, errorResponse, successResponse } from '@/utils/api'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

describe('API response helpers', () => {
  it('returns a consistent success envelope', async () => {
    const response = successResponse({ id: 'user_1' }, 'Loaded')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      data: { id: 'user_1' },
      message: 'Loaded',
    })
  })

  it('keeps backwards-compatible validation error arguments', async () => {
    const response = badRequest('Invalid input', {
      email: ['Email is required'],
    })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      success: false,
      message: 'Invalid input',
      errors: {
        email: ['Email is required'],
      },
    })
  })

  it('supports explicit error codes with field errors', async () => {
    const response = errorResponse('Invalid input', 422, 'VALIDATION_ERROR', {
      password: ['Password is too short'],
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toEqual({
      success: false,
      message: 'Invalid input',
      code: 'VALIDATION_ERROR',
      errors: {
        password: ['Password is too short'],
      },
    })
  })
})
