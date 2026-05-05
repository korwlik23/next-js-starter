import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'

// ─────────────────────────────────────────────
// Audit Service — ระบบบันทึกประวัติการกระทำของผู้ใช้
// บันทึกละเอียด: ใคร ทำอะไร ที่ไหน เมื่อไหร่ ผลเป็นอย่างไร
// ─────────────────────────────────────────────

export interface AuditLogInput {
  userId?: string
  tenantId?: string | null
  action: string
  entity?: string
  entityId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export const AuditService = {
  /**
   * บันทึก Log ใหม่ลงใน Database (แบบ Non-blocking เพื่อความปลอดภัย)
   */
  record(input: AuditLogInput) {
    // ไม่ใช้ await เพื่อไม่ให้การบันทึก Log ที่ผิดพลาดไปขัดขวางการทำงานหลักของระบบ
    Promise.resolve().then(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            id: GenerateId(),
            userId: input.userId,
            tenantId: input.tenantId,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
          },
        })
      } catch (error) {
        logger.error('[AuditService] Failed to record audit log', error)
      }
    })
  },

  /**
   * ดึงรายการ Log (Pagination)
   */
  async getLogs(params: {
    tenantId?: string | null
    userId?: string
    entity?: string
    action?: string
    page?: number
    limit?: number
  }) {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId: params.tenantId,
      userId: params.userId,
      entity: params.entity,
      action: params.action,
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      data: logs,
      meta: { total, page, limit },
    }
  },
}
