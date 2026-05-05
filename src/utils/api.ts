import type { ApiResponse, PaginatedResponse } from '@/types'
import { HTTP_STATUS } from '@/constants'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────
// SUCCESS RESPONSES
// ─────────────────────────────────────────
export function successResponse<T>(data: T, message?: string, status: number = HTTP_STATUS.OK) {
  const body: ApiResponse<T> = { success: true, data, message }
  return NextResponse.json(body, { status })
}

export function createdResponse<T>(data: T, message = 'Created successfully') {
  return successResponse(data, message, HTTP_STATUS.CREATED)
}

export function noContentResponse() {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT })
}

export function paginatedResponse<T>(
  data: T[],
  meta: { total: number; page: number; limit: number }
) {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  }
  return NextResponse.json(body)
}

// ─────────────────────────────────────────
// ERROR RESPONSES
// ─────────────────────────────────────────
export function errorResponse(
  message: string,
  status: number,
  code?: string,
  errors?: Record<string, string[]>
) {
  const body: ApiResponse = { success: false, message, code, errors }
  return NextResponse.json(body, { status })
}

export function badRequest(
  message = 'Bad Request',
  code?: string,
  errors?: Record<string, string[]>
) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, code, errors)
}

export function unauthorized(message = 'Unauthorized', code?: string) {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED, code)
}

export function forbidden(message = 'Forbidden', code?: string) {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN, code)
}

export function notFound(message = 'Not Found', code?: string) {
  return errorResponse(message, HTTP_STATUS.NOT_FOUND, code)
}

export function conflict(message = 'Conflict', code?: string) {
  return errorResponse(message, HTTP_STATUS.CONFLICT, code)
}

export function serverError(message = 'Internal Server Error', code?: string) {
  return errorResponse(message, HTTP_STATUS.INTERNAL_ERROR, code)
}
