import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { GetAllFeatureFlags, UpdateFeatureFlag } from './service'
import { updateFeatureFlagSchema } from './schema'
import { successResponse, badRequest, unauthorized, forbidden, serverError } from '@/utils/api'
import { PERMISSIONS } from '@/constants'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// Feature Flag Controller
// ────────────────────────────────────────

export class FeatureFlagController {
  /**
   * ดึง feature flags ทั้งหมด (admin only)
   */
  static async GetAll() {
    try {
      const user = await getAuthUser()
      if (!user) return unauthorized()
      if (!can(user, PERMISSIONS.SETTINGS_VIEW)) return forbidden()

      const flags = await GetAllFeatureFlags()
      return successResponse(flags)
    } catch (error) {
      logger.error('FeatureFlagController.GetAll error', error)
      return serverError()
    }
  }

  /**
   * อัปเดต feature flag (admin only)
   */
  static async Update(req: NextRequest) {
    try {
      const user = await getAuthUser()
      if (!user) return unauthorized()
      if (!can(user, PERMISSIONS.SETTINGS_UPDATE)) return forbidden()

      const body = await req.json()
      const parsed = updateFeatureFlagSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(
          'ข้อมูลไม่ถูกต้อง',
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      }

      const flag = await UpdateFeatureFlag(parsed.data.key, parsed.data.enabled)
      return successResponse(flag, `Feature "${parsed.data.key}" updated`)
    } catch (error) {
      logger.error('FeatureFlagController.Update error', error)
      return serverError()
    }
  }
}
