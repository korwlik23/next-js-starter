import { AsyncLocalStorage } from 'node:async_hooks'

// ─────────────────────────────────────────
// AUTHORIZATION CACHE (per request)
// ─────────────────────────────────────────
// authorize() ต้อง resolve principal จาก database เสมอเพื่อไม่ให้ปลอมจาก token ได้
// แต่ query นั้น join ลึกสามชั้น (roles -> role -> permissions -> permission)
// และหนึ่ง request มักเรียก authorize() หลายครั้ง เช่น layout, page และ route handler
//
// cache นี้มีอายุเท่ากับหนึ่ง request เท่านั้น จึงลด query ซ้ำได้โดยไม่มีความเสี่ยง
// เรื่องสิทธิ์ค้าง — เปลี่ยน role แล้ว request ถัดไปเห็นค่าใหม่ทันที
//
// ห้ามเปลี่ยนเป็น cache ข้าม request โดยไม่มีกลไก invalidation ที่ผูกกับการเปลี่ยน
// role/grant เพราะจะทำให้การถอนสิทธิ์ไม่มีผลจนกว่า cache จะหมดอายุ

export type CachedPrincipal = {
  userId: string
  tenantId: string | null
  roles: string[]
  permissions: string[]
}

export type AuthorizationCache = {
  get(userId: string): CachedPrincipal | undefined
  set(userId: string, principal: CachedPrincipal): void
}

const storage = new AsyncLocalStorage<Map<string, CachedPrincipal>>()

/**
 * รัน callback โดยมี cache ระดับ request หนึ่งชุด
 */
export function runWithAuthorizationCache<T>(callback: () => T): T {
  return storage.run(new Map(), callback)
}

/**
 * คืน cache ของ request ปัจจุบัน หรือ `undefined` เมื่ออยู่นอกบริบท
 * ผู้เรียกต้องทำงานได้ตามปกติเมื่อไม่มี cache
 */
export function getAuthorizationCache(): AuthorizationCache | undefined {
  const store = storage.getStore()

  if (!store) return undefined

  return {
    get: (userId) => store.get(userId),
    set: (userId, principal) => {
      store.set(userId, principal)
    },
  }
}
