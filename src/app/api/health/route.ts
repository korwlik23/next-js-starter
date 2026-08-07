import { timingSafeEqual } from 'crypto'
import { HealthService } from '@/modules/health/service'
import { getRequestId } from '@/lib/request-id'
import { successResponse, unauthorized } from '@/utils/api'
import { HTTP_STATUS } from '@/constants'

/**
 * Protect operational health data when HEALTH_CHECK_TOKEN is configured.
 * The token is accepted only through X-Health-Token; query tokens are ignored.
 */
function hasValidHealthToken(request: Request) {
  const expectedToken = process.env.HEALTH_CHECK_TOKEN
  if (!expectedToken) return true

  const providedToken = request.headers.get('X-Health-Token')
  if (!providedToken) return false

  const expectedBytes = Buffer.from(expectedToken)
  const providedBytes = Buffer.from(providedToken)

  return (
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes)
  )
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  if (!hasValidHealthToken(request)) {
    return unauthorized('Unauthorized', undefined, requestId)
  }

  const checks = await HealthService.checkSystemHealth()
  const booleanChecks = Object.values(checks).filter(
    (value): value is boolean => typeof value === 'boolean'
  )
  const isHealthy = booleanChecks.length > 0 && booleanChecks.every(Boolean)
  const data = {
    ...checks,
    status: isHealthy ? 'ok' : 'degraded',
  }

  return successResponse(data, undefined, isHealthy ? HTTP_STATUS.OK : 503, requestId)
}
