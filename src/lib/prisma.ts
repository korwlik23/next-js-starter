import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────
// Prisma Singleton (prevent hot-reload issues in dev)
// ─────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
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
          const result = await query(args)

          const mutations = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert']
          if (mutations.includes(operation) && model !== 'AuditLog') {
            try {
              // Extract header to determine who did it safely
              const { headers } = await import('next/headers')
              const h = await headers()
              const userId = h.get('x-user-id') || null
              const ipAddress = h.get('x-forwarded-for') || null

              const anyArgs = args as any
              const anyResult = result as any

              let entityId: string | null = null
              if (anyResult && typeof anyResult === 'object' && 'id' in anyResult) {
                entityId = anyResult.id as string
              } else if (anyArgs.where && typeof anyArgs.where === 'object' && 'id' in anyArgs.where) {
                entityId = anyArgs.where.id as string
              }

              let tenantId: string | null = null
              if (anyArgs.data && typeof anyArgs.data === 'object' && 'tenantId' in anyArgs.data) {
                tenantId = anyArgs.data.tenantId as string
              }

              if (userId) {
                const { GenerateId } = await import('@/lib/ulid')
                // Background logging so we don't delay the main response
                Promise.resolve(basePrisma.auditLog.create({
                  data: {
                    id: GenerateId(),
                    userId,
                    tenantId,
                    action: `${operation}_${model}`,
                    entity: model as string,
                    entityId,
                    ipAddress,
                    metadata: JSON.parse(JSON.stringify(args) || '{}'), // Only serialize clean JSON
                  }
                })).catch(err => {
                  console.error('[AuditLog Error]', err)
                })
              }
            } catch (_e) {
              // Not in request context or headers not available (e.g. background job/seeding)
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
