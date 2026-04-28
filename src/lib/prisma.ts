import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────
// Prisma Singleton (prevent hot-reload issues in dev)
// ─────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']

function redactSensitive(value: any): any {
  if (Array.isArray(value)) return value.map(redactSensitive)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const normalizedKey = key.toLowerCase()
      if (SENSITIVE_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
        return [key, '[REDACTED]']
      }
      return [key, redactSensitive(item)]
    })
  )
}

function createPrismaClient() {
  const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Prisma Extension: Automatically save AuditLog on mutations
  const extendedPrisma = basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // ─── PART 1: AUTO TENANT FILTER (Row Level Security) ───
          // ดึง tenantId จาก headers (ถ้ามี)
          try {
            const { headers } = await import('next/headers')
            const h = await headers()
            const tenantId = h.get('x-tenant-id') || h.get('x-user-tenant-id')

            // ถ้ามี tenantId และ model นั้นมีฟิลด์ tenantId ให้ฉีดเข้าไปใน where อัตโนมัติ
            const modelsWithTenant = ['User', 'AuditLog', 'Subscription', 'Invitation', 'ApiKey']
            if (tenantId && modelsWithTenant.includes(model)) {
              const anyArgs = args as any
              if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                anyArgs.where = { ...anyArgs.where, tenantId }
              } else if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                anyArgs.where = { ...anyArgs.where, tenantId }
              }
            }
          } catch {
            // Not in request context
          }

          // ─── PART 2: ORIGINAL QUERY EXECUTION ───
          const result = await query(args)

          // ─── PART 3: AUDIT LOGGING ───
          const mutations = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert']
          if (mutations.includes(operation) && model !== 'AuditLog') {
            try {
              const { headers } = await import('next/headers')
              const h = await headers()
              const userId = h.get('x-user-id') || null
              const ipAddress = h.get('x-forwarded-for') || null

              const anyArgs = args as any
              const anyResult = result as any

              let entityId: string | null = null
              if (anyResult && typeof anyResult === 'object' && 'id' in anyResult) {
                entityId = anyResult.id as string
              } else if (
                anyArgs.where &&
                typeof anyArgs.where === 'object' &&
                'id' in anyArgs.where
              ) {
                entityId = anyArgs.where.id as string
              }

              let tenantId: string | null = null
              if (anyArgs.data && typeof anyArgs.data === 'object' && 'tenantId' in anyArgs.data) {
                tenantId = anyArgs.data.tenantId as string
              }

              if (userId) {
                const { GenerateId } = await import('@/lib/ulid')
                Promise.resolve(
                  basePrisma.auditLog.create({
                    data: {
                      id: GenerateId(),
                      userId,
                      tenantId,
                      action: `${operation}_${model}`,
                      entity: model as string,
                      entityId,
                      ipAddress,
                      metadata: JSON.stringify(redactSensitive(args)),
                    },
                  })
                ).catch((err) => {
                  console.error('[AuditLog Error]', err)
                })
              }
            } catch {
              // Not in request context
            }
          }
          return result
        },
      },
    },
  })

  return extendedPrisma
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
