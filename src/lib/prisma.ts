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
        async $allOperations({ args, query }) {
          // ─── PART 1: AUTO TENANT FILTER (Row Level Security) ───
          // เราจะไม่เรียก headers() ตรงนี้เพราะเสี่ยงต่อการพังใน Next.js 15
          // แนะนำให้ส่ง tenantId ผ่าน args.where หรือวิธีการอื่นแทน
          /*
          try {
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
          */

          // ─── PART 2: ORIGINAL QUERY EXECUTION ───
          const result = await query(args)

          // ─── PART 3: AUDIT LOGGING (Temporarily disabled for debugging) ───
          /*
          const mutations = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert']
          if (mutations.includes(operation) && model !== 'AuditLog') {
            // ทำการบันทึก Log แบบ Async และดักจับ Error ทั้งหมด
            Promise.resolve().then(async () => {
              try {
                // ตรวจสอบว่าอยู่ใน Request Context หรือไม่
                let headersList
                try {
                  headersList = await headers()
                } catch {
                  return // ไม่อยู่ใน request context (เช่น background job)
                }

                const userId = headersList.get('x-user-id')
                const ipAddress = headersList.get('x-forwarded-for') || null

                if (!userId) return

                const anyArgs = args as any
                const anyResult = result as any

                let entityId: string | null = null
                if (anyResult && typeof anyResult === 'object' && 'id' in anyResult) {
                  entityId = anyResult.id as string
                } else if (anyArgs.where?.id) {
                  entityId = anyArgs.where.id
                }

                let tenantId: string | null = headersList.get('x-tenant-id') || null
                if (!tenantId && anyArgs.data?.tenantId) {
                  tenantId = anyArgs.data.tenantId
                }

                await basePrisma.auditLog.create({
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
              } catch (err) {
                console.error('[Prisma Audit Extension Error]', err)
              }
            })
          }
          */
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
