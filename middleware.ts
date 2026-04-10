import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { authConfig } from '@/config'
import { checkRateLimit } from '@/utils/rate-limit'

// ─── ภาษาที่รองรับ (ต้อง sync กับ src/i18n/config.ts)
const SUPPORTED_LOCALES = ['en', 'th'] as const
const DEFAULT_LOCALE = 'th'
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

// ─────────────────────────────────────────
// LOCALE DETECTION — ตรวจจับภาษาจาก Accept-Language header
// ─────────────────────────────────────────
function DetectLocale(req: NextRequest): string {
  // 1. ตรวจสอบ cookie ก่อน (ผู้ใช้เลือกเอง)
  const cookie_locale = req.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (cookie_locale && SUPPORTED_LOCALES.includes(cookie_locale as typeof SUPPORTED_LOCALES[number])) {
    return cookie_locale
  }

  // 2. ตรวจจับจาก Accept-Language header
  const accept_language = req.headers.get('accept-language') ?? ''
  const preferred_locales = accept_language
    .split(',')
    .map((lang) => {
      const [locale, quality] = lang.trim().split(';q=')
      return { locale: locale.split('-')[0].toLowerCase(), quality: quality ? parseFloat(quality) : 1 }
    })
    .sort((a, b) => b.quality - a.quality)

  // 3. หา match แรกที่รองรับ
  for (const { locale } of preferred_locales) {
    if (SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number])) {
      return locale
    }
  }

  // 4. Fallback เป็นภาษาเริ่มต้น
  return DEFAULT_LOCALE
}

// ─────────────────────────────────────────
// MIDDLEWARE — runs on Edge Runtime
// รวม Auth Protection + Locale Detection
// ─────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Skip static files & Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // ── Detect locale สำหรับทุก request
  const detected_locale = DetectLocale(req)

  // ── Public routes — allow without auth แต่ยัง set locale
  const isPublic = authConfig.publicRoutes.some((route) => pathname.startsWith(route))
  
  if (isPublic) {
    // ── Rate Limiting สำหรับหน้า Login ป้องกัน Brute force
    if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const { success } = await checkRateLimit(ip, 'auth')
      if (!success) {
         if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, message: 'Too Many Requests' }, { status: 429 })
         }
         return NextResponse.redirect(new URL('/429', req.url)) // Or render error page
      }
    }

    const response = NextResponse.next()
    // Set locale cookie ถ้ายังไม่มี
    if (!req.cookies.get(LOCALE_COOKIE_NAME)?.value) {
      response.cookies.set(LOCALE_COOKIE_NAME, detected_locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 ปี
        sameSite: 'lax',
      })
    }
    response.headers.set('x-locale', detected_locale)
    return response
  }

  const isApiRoute = pathname.startsWith('/api/')
  
  // ── Subdomain Routing สำหรับ Multi-Tenant
  const hostname = req.headers.get('host') || ''
  // เปลี่ยน yourdomain.com ตามโดเมนจริงของคุณในอนาคต (หรือใช้ env)
  const currentHost = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ROOT_DOMAIN 
    ? process.env.NEXT_PUBLIC_ROOT_DOMAIN 
    : 'localhost:3000'

  let tenantSlug = null
  if (hostname !== currentHost && !hostname.includes('vercel.app')) {
    // เช่น tenant-a.localhost:3000 -> subdomain คือ tenant-a
    tenantSlug = hostname.replace(`.${currentHost}`, '')
  }

  // ── Rate Limiting สำหรับ API ทั่วไป
  if (isApiRoute) {
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const { success, limit, remaining, reset } = await checkRateLimit(ip, 'api')
      if (!success) {
        return NextResponse.json(
          { success: false, message: 'Too Many Requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': (limit || 0).toString(),
              'X-RateLimit-Remaining': (remaining || 0).toString(),
              'X-RateLimit-Reset': (reset || 0).toString(),
            }
          }
        )
      }
  }

  const accessToken = req.cookies.get(authConfig.cookieName.accessToken)?.value
  const refreshToken = req.cookies.get(authConfig.cookieName.refreshToken)?.value

  // ── Helper สำหรับ Set Headers ให้ Request ต่อไป
  const constructHeaders = (baseHeaders: Headers, payload?: any) => {
    const requestHeaders = new Headers(baseHeaders)
    requestHeaders.set('x-locale', detected_locale)
    if (tenantSlug) {
      requestHeaders.set('x-tenant-slug', tenantSlug)
    }
    if (payload) {
      requestHeaders.set('x-user-id', payload.sub)
      requestHeaders.set('x-user-roles', JSON.stringify(payload.roles))
    }
    return requestHeaders
  }

  // ── Verify access token
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) {
      const requestHeaders = constructHeaders(req.headers, payload)
      
      const response = NextResponse.next({ request: { headers: requestHeaders } })
      if (!req.cookies.get(LOCALE_COOKIE_NAME)?.value) {
        response.cookies.set(LOCALE_COOKIE_NAME, detected_locale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        })
      }
      return response
    }
  }

  // ── Try refresh token
  if (refreshToken) {
    const userId = await verifyRefreshToken(refreshToken)
    if (userId) {
      const refreshUrl = new URL('/api/auth/refresh', req.url)
      return NextResponse.redirect(refreshUrl)
    }
  }

  // ── No valid token — redirect to login
  if (isApiRoute) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
