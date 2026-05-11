import { getAuthUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { resendEmailVerificationService } from '@/modules/auth/service'
import { serverError, successResponse, unauthorized } from '@/utils/api'

export async function POST() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const result = await resendEmailVerificationService(user.sub)
    return successResponse(
      result,
      result.alreadyVerified ? 'Email is already verified' : 'Verification email sent'
    )
  } catch (error) {
    logger.warn('Failed to resend email verification', { error, userId: user.sub })
    return serverError('Unable to send verification email')
  }
}
