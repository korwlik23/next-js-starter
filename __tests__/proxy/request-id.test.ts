import { attachRequestIdHeaders, getRequestId, isValidRequestId } from '@/lib/request-id'

describe('request correlation helpers', () => {
  it('preserves a safe client request id', () => {
    const request = {
      headers: new Headers({ 'X-Request-Id': 'client-request-123' }),
    } as Request

    expect(getRequestId(request)).toBe('client-request-123')
  })

  it('replaces unsafe request ids with a generated id', () => {
    const request = {
      headers: new Headers({ 'X-Request-Id': 'bad request-id' }),
    } as Request

    const requestId = getRequestId(request)

    expect(requestId).not.toBe('bad request-id')
    expect(isValidRequestId(requestId)).toBe(true)
  })

  it('uses the same id for response and trace headers', () => {
    const response = { headers: new Headers() } as Response

    attachRequestIdHeaders(response, 'response-request-123')

    expect(response.headers.get('X-Request-Id')).toBe('response-request-123')
    expect(response.headers.get('X-Trace-Id')).toBe('response-request-123')
  })
})
