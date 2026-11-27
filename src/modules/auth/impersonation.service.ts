import { signAuthTokens } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { CreateAuditLog } from '@/lib/audit'
import { GetUserWithPermissions, BuildTokenPayload } from './service'
import type { AuthTokens, TokenPayload } from '@/types'
import { can } from '@/lib/permissions'
import { PERMISSIONS } from '@/constants'

const FORBIDDEN_MESSAGE = 'สิทธิ์ไม่เพียงพอสำหรับการทำรายการนี้'

type DenyReason = 'self' | 'cross_tenant' | 'privilege_gain'

/**
 * ตรวจว่า actor สวมสิทธิ์เป็น target ได้หรือไม่ — คืนเหตุผลที่ปฏิเสธ หรือ null ถ้าอนุญาต
 *
 * - ห้ามสวมสิทธิ์ตัวเอง
 * - ต้องอยู่ tenant เดียวกัน ยกเว้น actor เป็นผู้ใช้ระดับแพลตฟอร์ม (tenantId = null)
 * - สิทธิ์ของ target ต้องเป็นสับเซตของสิทธิ์ actor — การสวมสิทธิ์ต้องไม่ทำให้ได้สิทธิ์เพิ่ม
 *
 * ถ้าไม่มีข้อนี้ admin ของ tenant หนึ่งจะออก token ในนาม owner ของแพลตฟอร์มได้
 */
function GetDenyReason(actor: TokenPayload, target: TokenPayload): DenyReason | null {
  if (actor.sub === target.sub) return 'self'

  const actor_is_platform = actor.tenantId == null
  if (!actor_is_platform && target.tenantId !== actor.tenantId) return 'cross_tenant'

  const actor_permissions = new Set(actor.permissions)
  if (!target.permissions.every((permission) => actor_permissions.has(permission))) {
    return 'privilege_gain'
  }

  return null
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
      throw new Error(FORBIDDEN_MESSAGE)
    }

    // 2. ดึงข้อมูล Target User
    const target_user = await GetUserWithPermissions(target_user_id)
    if (!target_user) {
      throw new Error('ไม่พบข้อมูลผู้ใช้เป้าหมาย')
    }

    // 3. สร้าง Payload แล้วตรวจขอบเขต tenant + สิทธิ์ ก่อนออก token
    const payload = BuildTokenPayload(target_user)
    const deny_reason = GetDenyReason(admin_payload, payload)
    if (deny_reason) {
      // บันทึกความพยายามที่ถูกปฏิเสธ — เป็นสัญญาณของการพยายามยกระดับสิทธิ์
      await CreateAuditLog({
        action: 'ADMIN_IMPERSONATION_DENIED',
        userId: admin_id,
        tenantId: admin_payload.tenantId ?? undefined,
        entity: 'User',
        entityId: target_user_id,
        metadata: { reason: deny_reason, targetTenantId: payload.tenantId ?? null },
      })
      logger.warn(`Impersonation denied (${deny_reason}): ${admin_id} -> ${target_user_id}`)
      throw new Error(
        deny_reason === 'self' ? 'ไม่สามารถสวมสิทธิ์เป็นบัญชีของตัวเองได้' : FORBIDDEN_MESSAGE
      )
    }
    payload.impersonatorId = admin_id

    // 4. สร้าง Tokens ใหม่
    const tokens = await signAuthTokens(payload)

    // 5. บันทึก Audit Log ใน tenant ของผู้ถูกสวมสิทธิ์ เพื่อให้ tenant นั้นเห็นว่าใครเข้ามาในนามใคร
    await CreateAuditLog({
      action: 'ADMIN_IMPERSONATION_STARTED',
      userId: admin_id,
      tenantId: payload.tenantId ?? undefined,
      entity: 'User',
      entityId: target_user_id,
      metadata: { adminEmail: admin_payload.email, targetEmail: payload.email },
    })
    logger.warn(`Admin ${admin_payload.email} started impersonating user ${payload.email}`)

    return { tokens, user: payload }
  }

  /**
   * หยุดการปลอมตัวและกลับสู่สิทธิ์เดิม
   * @param impersonator_id ID ของ Admin ที่ปลอมตัวอยู่
   * @param impersonated_user_id ID ของผู้ใช้ที่ถูกสวมสิทธิ์อยู่ (ใช้บันทึก audit)
   */
  static async StopImpersonation(
    impersonator_id: string,
    impersonated_user_id?: string
  ): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
    const admin = await GetUserWithPermissions(impersonator_id)
    if (!admin) {
      throw new Error('ไม่พบข้อมูล Admin ดั้งเดิม')
    }

    const payload = BuildTokenPayload(admin)
    const tokens = await signAuthTokens(payload)

    await CreateAuditLog({
      action: 'ADMIN_IMPERSONATION_STOPPED',
      userId: impersonator_id,
      tenantId: payload.tenantId ?? undefined,
      entity: 'User',
      entityId: impersonated_user_id,
    })
    logger.info(`Admin ${admin.email} stopped impersonation`)

    return { tokens, user: payload }
  }
}
