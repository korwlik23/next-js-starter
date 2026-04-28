import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

/**
 * ────────────────────────────────────────────────────────
 * Rate Limit Utility
 * ใช้ Upstash Redis เพื่อจำกัดการเข้าถึง API / หน้าที่ป้องกันการโดน Spam
 * มี In-memory fallback สำหรับ Development/Local
 * ────────────────────────────────────────────────────────
 */

// ── In-Memory Map Fallback
// ใช้เก็บ request counts และ reset time (ง่ายๆ สำหรับ memory rate limiting)
const inMemoryCache = new Map<string, { count: number; resetAt: number }>()

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export type RateLimitType = 'api' | 'auth' | 'heavyToken'

const ratelimitConfig = redis
  ? {
      api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), analytics: true }),
      auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 s'), analytics: true }),
      heavyToken: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
      }),
    }
  : null

/**
 * Limit Config สำหรับ In-Memory Fallback
 */
const fallbackLimits: Record<RateLimitType, { max: number; windowMs: number }> = {
  api: { max: 100, windowMs: 60 * 1000 }, // 100 req / minute
  auth: { max: 10, windowMs: 10 * 1000 }, // 10 req / 10 seconds
  heavyToken: { max: 5, windowMs: 60 * 1000 }, // 5 req / minute
}

export async function checkRateLimit(identifier: string, type: RateLimitType = 'api') {
  if (ratelimitConfig) {
    // ── ใช้ Upstash Redis (Production ready)
    const limiter = ratelimitConfig[type]
    const { success, limit, reset, remaining } = await limiter.limit(identifier)
    return { success, limited: !success, reset, limit, remaining }
  }

  // ── IN-MEMORY FALLBACK (Local / Dev)
  const now = Date.now()
  const key = `${type}:${identifier}`
  const config = fallbackLimits[type]

  let record = inMemoryCache.get(key)

  if (!record || now > record.resetAt) {
    // ไม่มีหรือหมดเวลา reset -> สร้างใหม่
    record = { count: 1, resetAt: now + config.windowMs }
    inMemoryCache.set(key, record)
    return {
      success: true,
      limited: false,
      reset: record.resetAt,
      limit: config.max,
      remaining: config.max - 1,
    }
  }

  // เพิ่ม count
  record.count += 1
  inMemoryCache.set(key, record)

  if (record.count > config.max) {
    logger.warn(`[RateLimit Fallback] Limit exceeded for ${key}`)
    return { success: false, limited: true, reset: record.resetAt, limit: config.max, remaining: 0 }
  }

  return {
    success: true,
    limited: false,
    reset: record.resetAt,
    limit: config.max,
    remaining: Math.max(0, config.max - record.count),
  }
}

/**
 * Clean up expired memory limits intermittently
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of inMemoryCache.entries()) {
    if (now > value.resetAt) {
      inMemoryCache.delete(key)
    }
  }
}, 60 * 1000) // Cleanup every 1 minute
