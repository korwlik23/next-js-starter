import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * ────────────────────────────────────────────────────────
 * Rate Limit Utility
 * ใช้ Upstash Redis เพื่อจำกัดการเข้าถึง API / หน้าที่ป้องกันการโดน Spam
 * ────────────────────────────────────────────────────────
 */

// สร้าง Redis client (หากไม่มี config ใน environment ตัวแปรจะถูกปล่อยเป็น null ไปก่อน 
// แต่เพื่อไม่ให้ app พังใน local เมื่อไม่มี env จึง mock object ขึ้นมาหากันพัง)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

/**
 * กำหนด rules สำหรับ Rate limits แต่ละประเภท
 */
const ratelimitConfig = redis ? {
  // สำหรับ API ทั่วไป: 100 requests per 1 minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }),
  // สำหรับหน้า SignIn/Auth: 10 requests per 10 seconds (ป้องกัน brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  }),
  // สำหรับการกระทำที่ใช้ทรัพยากรเยอะ (เช่น upload): 5 requests per 1 minute
  heavyToken: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }),
} : null

export async function checkRateLimit(
  identifier: string,
  type: 'api' | 'auth' | 'heavyToken' = 'api'
) {
  // ถ้าไม่ได้ตั้งค่า Upstash ไว้ ข้ามการทำงาน (allow) เพื่อไม่ให้กระทบ development environment
  if (!ratelimitConfig) {
    return { success: true, limited: false, reset: 0 }
  }

  const limiter = ratelimitConfig[type]
  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  // เราสามารถจับ event หรือรอ pending ถ้าต้องการแบบละเอียด
  return { success, limited: !success, reset, limit, remaining }
}
