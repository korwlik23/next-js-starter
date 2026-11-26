import { PrismaClient } from '@prisma/client'
import { getEnforcedTenantId } from '@/lib/tenant-context'
import { applyTenantScope } from '@/lib/tenant-scope'

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

  // ─────────────────────────────────────────
  // Prisma Extension: บังคับ tenant scope อัตโนมัติ (Row Level Security)
  // ─────────────────────────────────────────
  // อ่าน tenantId จาก AsyncLocalStorage ที่ตั้งโดย authorize()/withAuth()
  // ซึ่ง resolve user จาก database — ไม่ใช่จาก header ที่ client ปลอมได้
  //
  // นอกบริบท (seed, CLI, login lookup ก่อนรู้ tenant) จะไม่บังคับอะไร
  // ใน runUnscoped() จะข้ามการบังคับอย่างจงใจ
  //
  // logic อยู่ใน @/lib/tenant-scope เพื่อให้ unit test ได้โดยไม่ต้องมี database
  const extendedPrisma = basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return query(
            applyTenantScope({
              model,
              operation,
              args,
              tenantId: getEnforcedTenantId(),
            }) as typeof args
          )
        },
      },
    },
  })

  return extendedPrisma
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
