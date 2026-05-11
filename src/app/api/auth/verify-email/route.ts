import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailService } from '@/modules/auth/service'
import { badRequest, successResponse } from '@/utils/api'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=verification', req.url), 303)
  }

  try {
    await verifyEmailService(token)
    return NextResponse.redirect(new URL('/login?verified=1', req.url), 303)
  } catch (error) {
    logger.warn('Email verification failed', { error })
    return NextResponse.redirect(new URL('/login?error=verification', req.url), 303)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = typeof body.token === 'string' ? body.token : ''

    if (!token) {
      return badRequest('Verification token is required')
    }

    const result = await verifyEmailService(token)
    return successResponse(result, 'Email verified successfully')
  } catch (error) {
    logger.warn('Email verification failed', { error })
    return badRequest('Verification link is invalid or expired')
  }
}
