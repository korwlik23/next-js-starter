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
export function errorResponse(message: string, status: number, errors?: Record<string, string[]>) {
  const body: ApiResponse = { success: false, message, errors }
  return NextResponse.json(body, { status })
}

export function badRequest(message = 'Bad Request', errors?: Record<string, string[]>) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, errors)
}

export function unauthorized(message = 'Unauthorized') {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED)
}

export function forbidden(message = 'Forbidden') {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN)
}

export function notFound(message = 'Not Found') {
  return errorResponse(message, HTTP_STATUS.NOT_FOUND)
}

export function conflict(message = 'Conflict') {
  return errorResponse(message, HTTP_STATUS.CONFLICT)
}

export function serverError(message = 'Internal Server Error') {
  return errorResponse(message, HTTP_STATUS.INTERNAL_ERROR)
}
