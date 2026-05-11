import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { badRequest, successResponse, unauthorized } from '@/utils/api'
import { disableMfaService } from '@/modules/auth/service'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const code = typeof body.code === 'string' ? body.code : ''
    if (!code) return badRequest('MFA code is required')

    const result = await disableMfaService(user.sub, code)
    return successResponse(result, 'MFA disabled successfully')
  } catch (error) {
    logger.warn('MFA disable failed', { error, userId: user.sub })
    return badRequest('MFA code is invalid')
  }
}
