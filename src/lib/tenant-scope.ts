// ─────────────────────────────────────────
// TENANT SCOPE — logic บริสุทธิ์ แยกจาก Prisma client เพื่อให้ทดสอบได้
// ─────────────────────────────────────────

/**
 * model ที่มีฟิลด์ `tenantId` ใน prisma/schema.prisma
 * มี test คุมไม่ให้ drift ที่ `__tests__/lib/tenant-scope.test.ts`
 */
export const TENANT_SCOPED_MODELS = new Set([
  'ApiKey',
  'AuditLog',
  'EmailLog',
  'Invitation',
  'Role',
  'Subscription',
  'TenantMembership',
  'UploadedFile',
  'User',
  'UserRole',
])

/** operation ที่รับ filter อิสระใน `where` */
const WHERE_FILTER_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
])

/**
 * operation ที่ใช้ unique where
 * Prisma 5 รองรับ extendedWhereUnique จึงใส่ filter เพิ่มได้
 * และจะคืน RecordNotFound เมื่อ tenantId ไม่ตรง
 */
const UNIQUE_WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
  'upsert',
])

/** operation ที่สร้างข้อมูลใหม่ ต้องประทับ tenantId ลงใน payload */
const CREATE_OPERATIONS = new Set(['create', 'createMany', 'upsert'])

/** ถูก throw เมื่อมีความพยายามอ่าน/เขียนข้าม tenant */
export class TenantScopeViolationError extends Error {
  constructor(model: string, operation: string) {
    super(`Cross-tenant ${operation} on ${model} is not allowed`)
    this.name = 'TenantScopeViolationError'
  }
}

function assertTenantMatches(
  value: unknown,
  tenantId: string,
  model: string,
  operation: string
): void {
  if (value !== undefined && value !== null && value !== tenantId) {
    throw new TenantScopeViolationError(model, operation)
  }
}

export type TenantScopeInput = {
  model: string
  operation: string
  args: unknown
  /** `null` = ไม่บังคับ scope (อยู่นอก request context หรืออยู่ใน runUnscoped) */
  tenantId: string | null
}

/**
 * คืน args ชุดใหม่ที่ผูก tenantId เรียบร้อยแล้ว
 *
 * - operation ที่กรองด้วย where จะถูกฉีด `where.tenantId`
 * - operation ที่สร้างข้อมูลจะถูกประทับ `tenantId` ลงใน data/create
 * - ถ้า caller ระบุ tenantId ที่ขัดกับ context จะ throw TenantScopeViolationError
 *
 * ข้อจำกัดที่ทราบ: nested write (เช่น `tenant.update({ data: { users: { create } } })`)
 * ไม่ถูกครอบคลุม ให้เขียนผ่าน model โดยตรงแทน
 */
export function applyTenantScope({ model, operation, args, tenantId }: TenantScopeInput): unknown {
  if (!tenantId || !TENANT_SCOPED_MODELS.has(model)) {
    return args
  }

  const scoped: Record<string, any> = { ...((args as Record<string, any>) ?? {}) }

  if (WHERE_FILTER_OPERATIONS.has(operation) || UNIQUE_WHERE_OPERATIONS.has(operation)) {
    assertTenantMatches(scoped.where?.tenantId, tenantId, model, operation)
    scoped.where = { ...scoped.where, tenantId }
  }

  if (CREATE_OPERATIONS.has(operation)) {
    // upsert ใช้คีย์ `create`, ส่วน create/createMany ใช้ `data`
    const createKey = operation === 'upsert' ? 'create' : 'data'
    const payload = scoped[createKey]

    if (Array.isArray(payload)) {
      for (const row of payload) {
        assertTenantMatches(row?.tenantId, tenantId, model, operation)
      }
      scoped[createKey] = payload.map((row: Record<string, unknown>) => ({ ...row, tenantId }))
    } else if (payload && typeof payload === 'object') {
      assertTenantMatches(payload.tenantId, tenantId, model, operation)
      scoped[createKey] = { ...payload, tenantId }
    }
  }

  return scoped
}
