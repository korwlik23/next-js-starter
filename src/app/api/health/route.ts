import { HealthService } from '@/modules/health/service'
import { successResponse } from '@/utils/api'

export async function GET() {
  const checks = await HealthService.checkSystemHealth()
  return successResponse(checks)
}
