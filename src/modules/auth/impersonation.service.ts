import { signAuthTokens } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { GetUserWithPermissions, BuildTokenPayload } from './service'
import type { AuthTokens, TokenPayload } from '@/types'
import { can } from '@/lib/permissions'
import { PERMISSIONS } from '@/constants'

export class ImpersonationService {
  /**
   * เริ่มการปลอมตัวเป็นผู้ใช้อื่น
   * @param admin_id ID ของ Admin ที่ต้องการปลอมตัว
   * @param target_user_id ID ของผู้ใช้ที่ต้องการจะปลอมตัวเป็น
   */
  static async StartImpersonation(
    admin_id: string,
    target_user_id: string
  ): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
    // 1. ตรวจสอบสิทธิ์ Admin
    const admin = await GetUserWithPermissions(admin_id)

    if (!admin || !can(BuildTokenPayload(admin), PERMISSIONS.ADMIN_IMPERSONATE)) {
      throw new Error('สิทธิ์ไม่เพียงพอสำหรับการทำรายการนี้')
    }

    // 2. ดึงข้อมูล Target User
    const target_user = await GetUserWithPermissions(target_user_id)
    if (!target_user) {
      throw new Error('ไม่พบข้อมูลผู้ใช้เป้าหมาย')
    }

    // 3. สร้าง Payload โดยใส่ impersonatorId
    const payload = BuildTokenPayload(target_user)
    payload.impersonatorId = admin_id

    // 4. สร้าง Tokens ใหม่
    const tokens = await signAuthTokens(payload)

    logger.warn(`Admin ${admin?.email} started impersonating user ${target_user.email}`)

    // 5. บันทึก Audit Log (ถ้ามีระบบ Audit Log)
    // TODO: บันทึกรายการลง Audit Log

    return { tokens, user: payload }
  }

  /**
   * หยุดการปลอมตัวและกลับสู่สิทธิ์เดิม
   * @param impersonator_id ID ของ Admin ที่ปลอมตัวอยู่
   */
  static async StopImpersonation(
    impersonator_id: string
  ): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
    const admin = await GetUserWithPermissions(impersonator_id)
    if (!admin) {
      throw new Error('ไม่พบข้อมูล Admin ดั้งเดิม')
    }

    const payload = BuildTokenPayload(admin)
    const tokens = await signAuthTokens(payload)

    logger.info(`Admin ${admin.email} stopped impersonation`)

    return { tokens, user: payload }
  }
}
