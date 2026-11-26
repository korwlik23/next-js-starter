import type { ApiResponse, PaginatedResponse } from '@/types'
import { ERROR_CODES, HTTP_STATUS } from '@/constants'
import { attachRequestIdHeaders, createRequestId, isValidRequestId } from '@/lib/request-id'
import { NextResponse } from 'next/server'

type ApiMeta = {
  request_id: string
  [key: string]: unknown
}

type ErrorDetails = Record<string, string[]>

const DEFAULT_ERROR_CODES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: ERROR_CODES.BAD_REQUEST,
  [HTTP_STATUS.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [HTTP_STATUS.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HTTP_STATUS.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HTTP_STATUS.CONFLICT]: ERROR_CODES.CONFLICT,
  [HTTP_STATUS.UNPROCESSABLE]: ERROR_CODES.VALIDATION_ERROR,
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'REQ_RATE_LIMITED',
  [HTTP_STATUS.INTERNAL_ERROR]: ERROR_CODES.INTERNAL_ERROR,
}

function resolveRequestId(requestId?: string) {
  return isValidRequestId(requestId) ? requestId : createRequestId()
}

function responseWithRequestId<T>(body: T, status: number, requestId?: string) {
  const response = NextResponse.json(body, { status })
  return attachRequestIdHeaders(response, requestId)
}

// ─────────────────────────────────────────
// SUCCESS RESPONSES
// ─────────────────────────────────────────
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  requestId?: string
) {
  const body: ApiResponse<T> & { meta: ApiMeta } = {
    success: true,
    data,
    meta: { request_id: resolveRequestId(requestId) },
  }

  if (message !== undefined) body.message = message

  return responseWithRequestId(body, status, body.meta.request_id)
}

export function createdResponse<T>(data: T, message = 'Created successfully', requestId?: string) {
  return successResponse(data, message, HTTP_STATUS.CREATED, requestId)
}

export function noContentResponse(requestId?: string) {
  const response = new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT })
  return attachRequestIdHeaders(response, requestId)
}

export function paginatedResponse<T>(
  data: T[],
  meta: { total: number; page: number; limit: number },
  requestId?: string
) {
  const body: PaginatedResponse<T> & { meta: PaginatedResponse<T>['meta'] & ApiMeta } = {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
      request_id: resolveRequestId(requestId),
    },
  }
  return responseWithRequestId(body, HTTP_STATUS.OK, body.meta.request_id)
}

// ─────────────────────────────────────────
// ERROR RESPONSES
// ─────────────────────────────────────────
export function errorResponse(
  message: string,
  status: number,
  codeOrErrors?: string | Record<string, string[]>,
  errors?: Record<string, string[]>,
  requestId?: string
) {
  const code =
    typeof codeOrErrors === 'string'
      ? codeOrErrors
      : (DEFAULT_ERROR_CODES[status] ?? `HTTP_${status}`)
  const responseErrors = typeof codeOrErrors === 'string' ? errors : codeOrErrors
  const body: ApiResponse & { meta: ApiMeta } = {
    success: false,
    message,
    code,
    meta: { request_id: resolveRequestId(requestId) },
  }

  if (responseErrors !== undefined) body.errors = responseErrors

  return responseWithRequestId(body, status, body.meta.request_id)
}

export function badRequest(
  message = 'Bad Request',
  codeOrErrors?: string | Record<string, string[]>,
  errors?: Record<string, string[]>,
  requestId?: string
) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, codeOrErrors, errors, requestId)
}

export function unauthorized(message = 'Unauthorized', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED, code, undefined, requestId)
}

export function forbidden(message = 'Forbidden', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN, code, undefined, requestId)
}

export function unprocessableEntity(
  message = 'Validation failed',
  codeOrErrors?: string | ErrorDetails,
  errors?: ErrorDetails,
  requestId?: string
) {
  return errorResponse(message, HTTP_STATUS.UNPROCESSABLE, codeOrErrors, errors, requestId)
}

export function notFound(message = 'Not Found', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.NOT_FOUND, code, undefined, requestId)
}

export function conflict(message = 'Conflict', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.CONFLICT, code, undefined, requestId)
}

export function tooManyRequests(message = 'Too Many Requests', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.TOO_MANY_REQUESTS, code, undefined, requestId)
}

export function serverError(message = 'Internal Server Error', code?: string, requestId?: string) {
  return errorResponse(message, HTTP_STATUS.INTERNAL_ERROR, code, undefined, requestId)
}
