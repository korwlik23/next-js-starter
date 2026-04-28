import { auditLogQuerySchema } from './schema'
import { paginatedResponse, serverError } from '@/utils/api'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'

// ────────────────────────────────────────
// Audit Log Controller
// ────────────────────────────────────────

export class AuditController {
  /**
   * ดึง audit logs พร้อม pagination + filters
   */
  static async GetAuditLogs(req: Request, ctx: any) {
    try {
      const user = ctx.user
      const { searchParams } = new URL(req.url)

      const parsed = auditLogQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        action: searchParams.get('action'),
        entity: searchParams.get('entity'),
        userId: searchParams.get('userId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
      })

      // บังคับใช้ tenantId จาก user session เพื่อความปลอดภัย (Tenant Isolation)
      // ยกเว้นว่าเป็น Admin ส่วนกลาง (สมมติว่าไม่มี tenantId คือ admin ส่วนกลาง)
      const forcedTenantId = user.tenantId

      if (!parsed.success) {
        const query = { page: 1, limit: 10, tenantId: forcedTenantId }
        const { logs, total } = await AuditController.queryLogs(query)
        return paginatedResponse(logs, { total, ...query })
      }

      const { page, limit, ...filters } = parsed.data
      const { logs, total } = await AuditController.queryLogs({
        page,
        limit,
        ...filters,
        tenantId: forcedTenantId,
      })

      return paginatedResponse(logs, { total, page, limit })
    } catch (error) {
      logger.error('AuditController.GetAuditLogs error', error)
      return serverError()
    }
  }

  /**
   * Internal: query audit logs จาก DB
   */
  private static async queryLogs(params: {
    page: number
    limit: number
    action?: string
    entity?: string
    userId?: string
    tenantId?: string
    startDate?: string
    endDate?: string
  }) {
    const { page, limit, action, entity, userId, tenantId, startDate, endDate } = params

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (entity) where.entity = entity
    if (userId) where.userId = userId
    if (tenantId) where.tenantId = tenantId
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  }
}
