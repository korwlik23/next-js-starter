import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { badRequest, successResponse, unauthorized } from '@/utils/api'
import { confirmMfaSetupService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const code = typeof body.code === 'string' ? body.code : ''
    if (!code) return badRequest('MFA code is required')

    const result = await confirmMfaSetupService(user.sub, code)
    return successResponse(result, 'MFA enabled successfully')
  } catch (error) {
    logger.warn('MFA confirm failed', { error, userId: user.sub })
    return badRequest('MFA code is invalid or setup has not started')
  }
}
