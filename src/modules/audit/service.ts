import { prisma } from '@/lib/prisma'
import { ulid } from 'ulid'

export interface AuditLogData {
  userId?: string
  tenantId?: string
  action: string // e.g. 'user.login', 'tenant.upgrade', 'project.create'
  entity?: string // e.g. 'User', 'Tenant', 'Project'
  entityId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Service สำหรับบันทึก Audit Log ลงกฐานข้อมูล
 */
export async function logAction(data: AuditLogData) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        id: ulid(),
        ...data,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
    })
    return { success: true, log }
  } catch (error) {
    console.error('Failed to write audit log:', error)
    return { success: false, error }
  }
}

/**
 * ฟังก์ชันสำหรับดึง Audit Log ของ Tenant
 */
export async function getTenantAuditLogs(tenantId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })
}
