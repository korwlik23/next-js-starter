import { NextRequest } from 'next/server'
import { verifyMfaChallengeService } from '@/modules/auth/service'
import { setAuthCookies } from '@/lib/auth'
import { badRequest, successResponse } from '@/utils/api'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const code = typeof body.code === 'string' ? body.code : ''

    if (!challengeId || !code) {
      return badRequest('MFA challenge and code are required')
    }

    const { tokens, user } = await verifyMfaChallengeService(challengeId, code)
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

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
      'Signed in successfully'
    )
  } catch (error) {
    logger.warn('MFA verification failed', { error })
    return badRequest('MFA challenge or code is invalid')
  }
}
