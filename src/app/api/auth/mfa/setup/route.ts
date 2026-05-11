import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { startMfaSetupService } from '@/modules/auth/service'
import { serverError, successResponse, unauthorized } from '@/utils/api'
import { logger } from '@/lib/logger'

export async function POST(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const setup = await startMfaSetupService(user.sub, user.email)
    return successResponse(setup, 'MFA setup started')
  } catch (error) {
    logger.error('MFA setup failed', { error, userId: user.sub })
    return serverError('Unable to start MFA setup')
  }
}
