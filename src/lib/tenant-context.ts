import { AsyncLocalStorage } from 'node:async_hooks'

// ─────────────────────────────────────────
// TENANT CONTEXT (Row Level Security)
// ─────────────────────────────────────────
// บริบทของ tenant สำหรับ request ปัจจุบัน ถูกตั้งค่าจากฝั่ง server ที่เชื่อถือได้เท่านั้น
// (authorize() ที่อ่าน user จาก database) ห้ามตั้งจาก header ที่ client ส่งมาได้
//
// prisma extension ใน `@/lib/prisma` จะอ่านบริบทนี้แล้วฉีด tenantId ลงใน query
// อัตโนมัติ ทำให้ "ลืมกรอง tenant" ไม่ใช่สิ่งที่เกิดขึ้นได้จากการเผลอ

export type TenantContext = {
  /** tenant ของ principal ปัจจุบัน; `null` = ยังไม่ผูกกับ tenant ใด */
  tenantId: string | null
  /** user ที่เป็นเจ้าของ request ปัจจุบัน ใช้สำหรับ audit */
  userId: string | null
  /**
   * `true` เมื่ออยู่ในบล็อก runUnscoped() เท่านั้น
   * ใช้กับงานระดับแพลตฟอร์มที่ต้องมองข้าม tenant จริง ๆ
   */
  unscoped?: boolean
  /** เหตุผลของการ unscope ใช้ประกอบการ audit/debug */
  unscopedReason?: string
}

// ต้องผูก storage ไว้กับ globalThis
//
// Next.js ประเมินโมดูลเดียวกันได้หลายครั้งข้าม bundle (route handler, server
// component, HMR) ขณะที่ prisma client ถูก cache ไว้บน globalThis ครั้งเดียว
// ถ้าปล่อยให้แต่ละสำเนามี AsyncLocalStorage ของตัวเอง prisma extension จะอ่าน
// สำเนาที่ไม่มีใครเขียน แล้วมองไม่เห็น tenant — scope จะเงียบหายไปทั้งระบบ
// โดยที่ unit test ยังผ่าน เพราะใน jest มีสำเนาเดียว
const globalForTenantContext = globalThis as unknown as {
  __tenantContextStorage?: AsyncLocalStorage<TenantContext>
}

const storage =
  globalForTenantContext.__tenantContextStorage ??
  (globalForTenantContext.__tenantContextStorage = new AsyncLocalStorage<TenantContext>())

/**
 * รัน callback ภายใต้บริบทของ tenant ที่ระบุ
 * ทุก prisma query ที่เกิดขึ้นข้างในจะถูกกรองด้วย tenantId นี้อัตโนมัติ
 */
export function runWithTenantContext<T>(
  context: Omit<TenantContext, 'unscoped' | 'unscopedReason'>,
  callback: () => T
): T {
  return storage.run({ ...context }, callback)
}

/**
 * ข้าม tenant scope อย่างจงใจ สำหรับงานระดับแพลตฟอร์มเท่านั้น
 * เช่น ops dashboard, migration, cross-tenant reconciliation
 *
 * ต้องระบุเหตุผลเสมอเพื่อให้ code review เห็นว่าเป็นความตั้งใจ ไม่ใช่การลืม
 */
export function runUnscoped<T>(reason: string, callback: () => T): T {
  if (!reason.trim()) {
    throw new Error('runUnscoped() ต้องระบุเหตุผล')
  }

  const current = storage.getStore()

  return storage.run(
    {
      tenantId: current?.tenantId ?? null,
      userId: current?.userId ?? null,
      unscoped: true,
      unscopedReason: reason,
    },
    callback
  )
}

/** อ่านบริบทปัจจุบัน คืน `undefined` เมื่ออยู่นอก request (เช่น seed, CLI) */
export function getTenantContext(): TenantContext | undefined {
  return storage.getStore()
}

/**
 * คืน tenantId ที่ต้องใช้บังคับกับ query หรือ `null` เมื่อไม่ต้องบังคับ
 * (อยู่นอกบริบท, อยู่ใน runUnscoped หรือ principal ยังไม่ผูก tenant)
 */
export function getEnforcedTenantId(): string | null {
  const context = storage.getStore()

  if (!context || context.unscoped) return null

  return context.tenantId
}
