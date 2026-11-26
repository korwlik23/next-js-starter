import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig } from '@/config'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'
import {
  attachRequestIdHeaders,
  getRequestId,
  isValidRequestId,
  REQUEST_ID_HEADER,
} from '@/lib/request-id'
import { checkRateLimit } from '@/utils/rate-limit'
import { forbidden, tooManyRequests, unauthorized } from '@/utils/api'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from '@/i18n/config'

const OAUTH_PUBLIC_ROUTE = /^\/api\/auth\/[^/]+\/(login|callback)$/
const ADMIN_PERMISSION = 'admin.access'
const LOCALE_COOKIE_NAME = 'locale'

function detectLocale(request: NextRequest): SupportedLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number])) {
    return cookieLocale as SupportedLocale
  }

  const acceptedLanguages = request.headers.get('accept-language') ?? ''
  const preferredLocales = acceptedLanguages
    .split(',')
    .map((language) => {
      const [locale, quality] = language.trim().split(';q=')
      return {
        locale: locale.split('-')[0].toLowerCase(),
        quality: quality ? Number.parseFloat(quality) : 1,
      }
    })
    .sort((a, b) => b.quality - a.quality)

  return (
    (preferredLocales.find(({ locale }) =>
      SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])
    )?.locale as SupportedLocale | undefined) ?? DEFAULT_LOCALE
  )
}

function stripLocalePrefix(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split('/')
  if (!SUPPORTED_LOCALES.includes(maybeLocale as (typeof SUPPORTED_LOCALES)[number])) {
    return pathname
  }

  return rest.length > 0 ? `/${rest.join('/')}` : '/'
}

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/')
}

function isDevRoute(pathname: string) {
  return pathname === '/dev' || pathname.startsWith('/dev/')
}

function isPublicRoute(pathname: string) {
  return (
    authConfig.publicRoutes.some((route) =>
      route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    OAUTH_PUBLIC_ROUTE.test(pathname) ||
    pathname === '/server-error' ||
    pathname === '/forbidden'
  )
}

function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permissions) return false
  if (permissions.includes('*')) return true
  const [module] = permission.split('.')
  return permissions.includes(permission) || permissions.includes(`${module}.*`)
}

function attachRequestHeaders(response: NextResponse, requestId: string) {
  const responseRequestId = response.headers.get(REQUEST_ID_HEADER)
  const effectiveRequestId = isValidRequestId(responseRequestId) ? responseRequestId : requestId

  return attachRequestIdHeaders(response, effectiveRequestId)
}

function unauthorizedResponse(request: NextRequest, pathname: string, requestId: string) {
  if (isApiRoute(pathname)) {
    return attachRequestHeaders(unauthorized('Unauthorized', undefined, requestId), requestId)
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`)
  return attachRequestHeaders(NextResponse.redirect(loginUrl), requestId)
}

async function applyRateLimit(request: NextRequest, type: 'api' | 'auth', requestId: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await checkRateLimit(ip, type)

  if (success) return null

  const response = tooManyRequests('Too Many Requests', undefined, requestId)
  response.headers.set('X-RateLimit-Limit', String(limit || 0))
  response.headers.set('X-RateLimit-Remaining', String(remaining || 0))
  response.headers.set('X-RateLimit-Reset', String(reset || 0))

  return attachRequestHeaders(response, requestId)
}

function nextForRequest(request: NextRequest, requestId: string) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  const locale = detectLocale(request)

  if (!request.cookies.get(LOCALE_COOKIE_NAME)?.value) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  response.headers.set('x-locale', locale)
  return attachRequestHeaders(response, requestId)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const normalizedPathname = stripLocalePrefix(pathname)
  const apiRoute = isApiRoute(normalizedPathname)
  const requestId = getRequestId(request)

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.includes('.')) {
    return NextResponse.next()
  }

  const publicRoute = isPublicRoute(normalizedPathname)

  if (normalizedPathname !== pathname) {
    const url = request.nextUrl.clone()
    url.pathname = normalizedPathname
    return attachRequestHeaders(NextResponse.redirect(url), requestId)
  }

  if (apiRoute) {
    const rateLimitResponse = await applyRateLimit(
      request,
      normalizedPathname.startsWith('/api/auth/') ? 'auth' : 'api',
      requestId
    )
    if (rateLimitResponse) return rateLimitResponse
  }

  if (publicRoute || (process.env.NODE_ENV === 'development' && isDevRoute(normalizedPathname))) {
    return nextForRequest(request, requestId)
  }

  const accessToken = request.cookies.get(authConfig.cookieName.accessToken)?.value
  const refreshToken = request.cookies.get(authConfig.cookieName.refreshToken)?.value

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) {
      if (
        (normalizedPathname.startsWith('/admin') ||
          (process.env.NODE_ENV === 'production' && isDevRoute(normalizedPathname))) &&
        !hasPermission(payload.permissions, ADMIN_PERMISSION)
      ) {
        if (apiRoute) {
          return attachRequestHeaders(forbidden('Forbidden', undefined, requestId), requestId)
        }
        return attachRequestHeaders(
          NextResponse.redirect(new URL('/forbidden', request.url)),
          requestId
        )
      }

      return nextForRequest(request, requestId)
    }
  }

  if (refreshToken) {
    const userId = await verifyRefreshToken(refreshToken)
    if (userId) {
      if (apiRoute) {
        const response = unauthorized('Access token expired', 'AUTH_TOKEN_EXPIRED', requestId)
        response.headers.set('x-auth-refreshable', 'true')
        return attachRequestHeaders(response, requestId)
      }

      const refreshUrl = new URL('/api/auth/refresh', request.url)
      refreshUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`)
      return attachRequestHeaders(NextResponse.redirect(refreshUrl), requestId)
    }
  }

  return unauthorizedResponse(request, pathname, requestId)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
