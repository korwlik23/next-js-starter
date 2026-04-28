import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// Feature Flag Service
// จัดการ runtime feature toggles ผ่าน DB
// ────────────────────────────────────────

// ─── In-memory cache สำหรับลด DB queries
let featureFlagCache: Map<string, boolean> | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 1000 // 1 นาที

/**
 * ดึง feature flags ทั้งหมดจาก DB
 */
export async function GetAllFeatureFlags() {
  return await prisma.featureFlag.findMany({
    orderBy: { key: 'asc' },
  })
}

/**
 * อัปเดตสถานะ feature flag
 */
export async function UpdateFeatureFlag(key: string, enabled: boolean) {
  const result = await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled, updatedAt: new Date() },
    create: {
      id: GenerateId(),
      key,
      enabled,
      description: '',
    },
  })

  // Invalidate cache เมื่อมีการเปลี่ยนแปลง
  featureFlagCache = null
  logger.info(`Feature flag "${key}" set to ${enabled}`)

  return result
}

/**
 * ตรวจสอบว่า feature เปิดอยู่หรือไม่
 * ใช้ in-memory cache เพื่อลด DB queries
 * Fallback ไปที่ config/index.ts ถ้าไม่มีใน DB
 */
export async function IsFeatureEnabled(key: string): Promise<boolean> {
  try {
    // ตรวจสอบ cache
    const now = Date.now()
    if (featureFlagCache && now - cacheTimestamp < CACHE_TTL_MS) {
      const cached = featureFlagCache.get(key)
      if (cached !== undefined) return cached
    }

    // Reload cache
    const flags = await prisma.featureFlag.findMany()
    featureFlagCache = new Map(flags.map((f) => [f.key, f.enabled]))
    cacheTimestamp = now

    const value = featureFlagCache.get(key)
    if (value !== undefined) return value

    // Fallback: ไม่มีใน DB → ถือว่าปิด
    return false
  } catch (error) {
    logger.error('IsFeatureEnabled error', error)
    return false
  }
}
