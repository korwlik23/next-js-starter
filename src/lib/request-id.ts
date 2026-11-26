export const REQUEST_ID_HEADER = 'x-request-id'
export const TRACE_ID_HEADER = 'x-trace-id'

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/

type HeaderSource =
  | Pick<Headers, 'get'>
  | {
      headers: Pick<Headers, 'get'>
    }
  | null
  | undefined

export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value)
}

export function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)

  if (!bytes.some((byte) => byte !== 0)) {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function getRequestId(source?: HeaderSource): string {
  const headers = source && 'headers' in source ? source.headers : source
  const candidate = headers?.get(REQUEST_ID_HEADER)

  return isValidRequestId(candidate) ? candidate : createRequestId()
}

export function attachRequestIdHeaders<T extends Response>(response: T, requestId?: string): T {
  const id = isValidRequestId(requestId) ? requestId : createRequestId()

  response.headers.set(REQUEST_ID_HEADER, id)
  response.headers.set(TRACE_ID_HEADER, id)

  return response
}
