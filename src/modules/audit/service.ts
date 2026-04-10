import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'

/**
 * ─────────────────────────────────────────
 * Audit Log Service
 * ใช้เพื่อบันทึกพฤติกรรมการใช้งานในระบบแบบ Manual
 * (ใน Prisma $extends เรามี Auto-log อยู่แล้ว แต่อาจใช้ Service นี้สำหรับการ Custom action พิเศษ)
 * ─────────────────────────────────────────
 */

export class AuditService {
  /**
   * บันทึกเหตุการณ์ (Action) เข้าสู่ระบบอย่างปลอดภัย
   * @param params 
   */
  static async logAction(params: {
    action: string
    userId?: string
    tenantId?: string
    entity?: string
    entityId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          id: GenerateId(),
          action: params.action,
          userId: params.userId,
          tenantId: params.tenantId,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      })
    } catch (error) {
      // ป้องกันไม้ให้ระบบหลักพัง ถ้า Audit Error
      console.error('[AuditService.logAction] Failed:', error)
    }
  }
}
