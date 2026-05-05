import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/modules/auth/schema'
import { loginService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { successResponse, badRequest, errorResponse } from '@/utils/api'
import { logger } from '@/lib/logger'
import { HTTP_STATUS } from '@/constants'
import { AuditService } from '@/modules/audit/service'
import { getRequestMetadata } from '@/utils/request'

export async function POST(req: NextRequest) {
  const isFormPost = req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
  let attemptedEmail: string | undefined

  try {
    const body = isFormPost
      ? Object.fromEntries((await req.formData()).entries())
      : await req.json()
    attemptedEmail = typeof body.email === 'string' ? body.email : undefined
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>
      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url), 303)
      }
      return badRequest('ข้อมูลไม่ถูกต้อง', errors)
    }

    const { tokens, user } = await loginService(parsed.data)

    // Audit Log: Login Success
    const { ipAddress, userAgent } = getRequestMetadata(req)
    AuditService.record({
      userId: user.sub,
      tenantId: user.tenantId,
      action: 'AUTH_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    })

    // Set httpOnly cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    if (isFormPost) {
      return NextResponse.redirect(new URL('/dashboard', req.url), 303)
    }

    return successResponse(
      {
        user: {
          id: user.sub,
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          tenantId: user.tenantId,
        },
      },
      'เข้าสู่ระบบสำเร็จ'
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    logger.error('Login error', error)

    if (message.includes('ไม่ถูกต้อง')) {
      // Audit Log: Login Failed (Invalid Credentials)
      const { ipAddress, userAgent } = getRequestMetadata(req)
      AuditService.record({
        action: 'AUTH_LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: {
          email: attemptedEmail,
          reason: 'Invalid credentials',
        },
      })

      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url), 303)
      }
      return errorResponse(message, HTTP_STATUS.UNAUTHORIZED)
    }
    if (isFormPost) {
      return NextResponse.redirect(new URL('/login?error=server', req.url), 303)
    }
    return errorResponse('เกิดข้อผิดพลาดภายในระบบ', HTTP_STATUS.INTERNAL_ERROR)
  }
}
