import { apiClient } from '@/services/apiClient'

describe('API client response-contract compatibility', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('unwraps normal success data when correlation metadata is present', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 'user_1' },
        meta: { request_id: 'request-123' },
      }),
    } as Response)

    const result = await apiClient<{ id: string }>('/api/user')

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ id: 'user_1' })
  })

  it('keeps the full response for pagination metadata with correlation metadata', async () => {
    const response = {
      success: true,
      data: [{ id: 'user_1' }],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        request_id: 'page-123',
      },
    }

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    } as Response)

    const result = await apiClient<typeof response>('/api/user?page=1')

    expect(result.error).toBeNull()
    expect(result.data).toEqual(response)
  })

  it('keeps the full response for legacy pagination metadata without a request id', async () => {
    const response = {
      success: true,
      data: [{ id: 'user_1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    } as Response)

    const result = await apiClient<typeof response>('/api/user?page=1')

    expect(result.error).toBeNull()
    expect(result.data).toEqual(response)
  })
})
