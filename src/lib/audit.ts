import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'

// ─────────────────────────────────────────
// AUDIT LOG SERVICE
// ─────────────────────────────────────────
// หน้าที่: บันทึกทุกๆ เหตุการณ์สำคัญ (Actions) ของระบบ
// เช่น การเข้าสู่ระบบ, การเปลี่ยนแปลงข้อมูล Tenant, การแก้ไข Permission

interface CreateAuditLogParams {
  action: string // เช่น 'USER_LOGIN', 'TENANT_UPDATED'
  userId?: string // คนที่ทำ action
  tenantId?: string // ภายใต้ tenant ไหน (ถ้ามี)
  entity?: string // ตารางหรือ resource เช่น 'User', 'Tenant', 'Subscription'
  entityId?: string // ID ของ resource
  metadata?: any // ข้อมูลเพิ่มเติม (JSON) เช่น before/after changes
}

/**
 * สร้าง Audit Log และเก็บข้อมูลรายละเอียด Request เบื้องต้น (IP, User Agent)
 */
export async function CreateAuditLog({
  action,
  userId,
  tenantId,
  entity,
  entityId,
  metadata,
}: CreateAuditLogParams) {
  try {
    // พยายามดึงข้อมูล Request เบื้องต้นแบบ async จาก next/headers
    let ipAddress = 'unknown'
    let userAgent = 'unknown'

    try {
      const hdrs = await headers()
      ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0] || hdrs.get('x-real-ip') || 'unknown'
      userAgent = hdrs.get('user-agent') || 'unknown'
    } catch {
      // ในบางกรณีที่ไม่ได้รันใน request context จะ error ได้ จึง catch ไว้หลวมๆ
    }

    await prisma.auditLog.create({
      data: {
        id: GenerateId(),
        action,
        userId,
        tenantId,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress,
        userAgent,
      },
    })

    // บันทึกลง System Logger ด้วย (สามารถนำไปออก ELK Stack หรือ Datadog ได้)
    logger.info(`[AUDIT] ${action}`, { userId, tenantId, entity, entityId })
  } catch (error) {
    logger.error('[AUDIT] Failed to create audit log', { error })
  }
}
