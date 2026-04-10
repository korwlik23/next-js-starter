import { LRUCache } from 'lru-cache'

// ────────────────────────────────────────
// Rate Limiter — จำกัดจำนวน request ต่อ IP
// ใช้ LRU Cache เก็บ token count ตาม IP address
// ────────────────────────────────────────

/** ตัวเลือกสำหรับกำหนดค่า rate limiter */
interface RateLimitOptions {
  /** ช่วงเวลาในหน่วย milliseconds (เช่น 60000 = 1 นาที) */
  interval: number
  /** จำนวน unique token (IP) สูงสุดที่เก็บใน cache */
  unique_token_per_interval: number
  /** จำนวน request สูงสุดต่อ token ต่อ interval */
  max_requests: number
}

interface RateLimitResult {
  /** อนุญาตให้ทำ request หรือไม่ */
  is_allowed: boolean
  /** จำนวน request ที่เหลือ */
  remaining: number
  /** เวลาที่ต้องรอก่อนลองใหม่ (ms) */
  retry_after: number
}

/**
 * สร้าง rate limiter instance
 * @example
 * const limiter = CreateRateLimiter({ interval: 60000, unique_token_per_interval: 500, max_requests: 10 })
 * const result = limiter.Check('192.168.1.1')
 * if (!result.is_allowed) return Response.json({ error: 'Too many requests' }, { status: 429 })
 */
export function CreateRateLimiter(options: RateLimitOptions) {
  const { interval, unique_token_per_interval, max_requests } = options

  // LRU Cache เก็บจำนวน request ต่อ token
  const token_cache = new LRUCache<string, { count: number; reset_time: number }>({
    max: unique_token_per_interval,
    ttl: interval,
  })

  return {
    /**
     * ตรวจสอบว่า token (IP) ยังสามารถทำ request ได้หรือไม่
     */
    Check(token: string): RateLimitResult {
      const now = Date.now()
      const entry = token_cache.get(token)

      // token ใหม่ — อนุญาตและเริ่มนับ
      if (!entry) {
        token_cache.set(token, { count: 1, reset_time: now + interval })
        return { is_allowed: true, remaining: max_requests - 1, retry_after: 0 }
      }

      // ถ้าหมดเวลา interval — reset count
      if (now >= entry.reset_time) {
        token_cache.set(token, { count: 1, reset_time: now + interval })
        return { is_allowed: true, remaining: max_requests - 1, retry_after: 0 }
      }

      // ยังอยู่ใน interval — เช็ค count
      if (entry.count >= max_requests) {
        return {
          is_allowed: false,
          remaining: 0,
          retry_after: entry.reset_time - now,
        }
      }

      // อนุญาตและเพิ่ม count
      entry.count++
      return { is_allowed: true, remaining: max_requests - entry.count, retry_after: 0 }
    },

    /**
     * Reset count สำหรับ token ที่กำหนด
     */
    Reset(token: string): void {
      token_cache.delete(token)
    },
  }
}

// ────────────────────────────────────────
// Pre-configured Rate Limiters — สำหรับ API routes ต่างๆ
// ────────────────────────────────────────

/** สำหรับ auth routes (login, register) — 5 requests/15 วินาที */
export const AUTH_RATE_LIMITER = CreateRateLimiter({
  interval: 15_000,
  unique_token_per_interval: 500,
  max_requests: 5,
})

/** สำหรับ API ทั่วไป — 60 requests/นาที */
export const API_RATE_LIMITER = CreateRateLimiter({
  interval: 60_000,
  unique_token_per_interval: 500,
  max_requests: 60,
})

/**
 * Helper — ดึง IP จาก request headers
 */
export function GetClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
