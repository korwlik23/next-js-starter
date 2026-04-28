import { z } from 'zod'

// ────────────────────────────────────────
// Audit Log Schema — Zod validation สำหรับ query audit logs
// ────────────────────────────────────────

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const createAuditLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>
