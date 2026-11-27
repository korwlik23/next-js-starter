import { signAuthTokens } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { GetUserWithPermissions, BuildTokenPayload } from './service'
import type { AuthTokens, TokenPayload } from '@/types'
import { can } from '@/lib/permissions'
import { PERMISSIONS } from '@/constants'

/**
 * ตรวจว่า actor สวมสิทธิ์เป็น target ได้หรือไม่
 *
 * - ห้ามสวมสิทธิ์ตัวเอง
 * - ต้องอยู่ tenant เดียวกัน ยกเว้น actor เป็นผู้ใช้ระดับแพลตฟอร์ม (tenantId = null)
 * - สิทธิ์ของ target ต้องเป็นสับเซตของสิทธิ์ actor — การสวมสิทธิ์ต้องไม่ทำให้ได้สิทธิ์เพิ่ม
 *
 * ถ้าไม่มีข้อนี้ admin ของ tenant หนึ่งจะออก token ในนาม owner ของแพลตฟอร์มได้
 */
function AssertCanImpersonate(actor: TokenPayload, target: TokenPayload) {
  if (actor.sub === target.sub) {
    throw new Error('ไม่สามารถสวมสิทธิ์เป็นบัญชีของตัวเองได้')
  }

  const actor_is_platform = actor.tenantId == null
  if (!actor_is_platform && target.tenantId !== actor.tenantId) {
    throw new Error('สิทธิ์ไม่เพียงพอสำหรับการทำรายการนี้')
  }

  const actor_permissions = new Set(actor.permissions)
  if (!target.permissions.every((permission) => actor_permissions.has(permission))) {
    throw new Error('สิทธิ์ไม่เพียงพอสำหรับการทำรายการนี้')
  }
}

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
    const admin_payload = admin ? BuildTokenPayload(admin) : null

    if (!admin_payload || !can(admin_payload, PERMISSIONS.ADMIN_IMPERSONATE)) {
      throw new Error('สิทธิ์ไม่เพียงพอสำหรับการทำรายการนี้')
    }

    // 2. ดึงข้อมูล Target User
    const target_user = await GetUserWithPermissions(target_user_id)
    if (!target_user) {
      throw new Error('ไม่พบข้อมูลผู้ใช้เป้าหมาย')
    }

    // 3. สร้าง Payload แล้วตรวจขอบเขต tenant + สิทธิ์ ก่อนออก token
    const payload = BuildTokenPayload(target_user)
    AssertCanImpersonate(admin_payload, payload)
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
