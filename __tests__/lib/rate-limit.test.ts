import { CreateRateLimiter } from '../../src/lib/rate-limit'

describe('Rate Limiter Utility Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('ต้องอนุญาตให้ request ใหม่ผ่าน และลดยอดจำนวนที่เหลือถูกต้อง', () => {
    const limiter = CreateRateLimiter({
      interval: 1000,
      unique_token_per_interval: 10,
      max_requests: 3,
    })
    const result = limiter.Check('127.0.0.1')

    expect(result.is_allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('ต้องบล็อคเมื่อผู้ใช้ยิง API ถี่เกิน Limit ที่กำหนดไว้', () => {
    const limiter = CreateRateLimiter({
      interval: 1000,
      unique_token_per_interval: 10,
      max_requests: 2,
    })

    // ครั้งที่ 1 - ผ่าน
    limiter.Check('127.0.0.2')

    // ครั้งที่ 2 - ผ่าน
    const allowed_result = limiter.Check('127.0.0.2')
    expect(allowed_result.is_allowed).toBe(true)
    expect(allowed_result.remaining).toBe(0)

    // ครั้งที่ 3 - โดนบล็อค
    const blocked_result = limiter.Check('127.0.0.2')
    expect(blocked_result.is_allowed).toBe(false)
    expect(blocked_result.remaining).toBe(0)
    expect(blocked_result.retry_after).toBeGreaterThan(0)
  })

  it('ต้องเคลียร์ประวัติและอนุญาตให้ใช้งานใหม่เมื่อหมดเวลา Reset time', () => {
    const limiter = CreateRateLimiter({
      interval: 1000,
      unique_token_per_interval: 10,
      max_requests: 1,
    })

    // ยิงครั้งแรก - ผ่าน
    limiter.Check('127.0.0.3')

    // ถ้ายิงซ้ำจะถูกบล็อค
    expect(limiter.Check('127.0.0.3').is_allowed).toBe(false)

    // ข้ามเวลาไป 1 วินาที
    jest.advanceTimersByTime(1001)

    // ต้องกลับมาอนุญาตได้
    const reset_result = limiter.Check('127.0.0.3')
    expect(reset_result.is_allowed).toBe(true)
  })
})
