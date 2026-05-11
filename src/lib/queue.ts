import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'

/**
 * ────────────────────────────────────────
 * Job Queue System (Senior Level)
 * สำหรับรัน Background Job ใน Serverless (Next.js)
 * ผสานกับ Upstash Redis (LPUSH/BRPOP หรือใช้ร่วมกับ QStash)
 * ────────────────────────────────────────
 */

// Initialize Redis Client อย่างปลอดภัย
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export interface JobPayload {
  jobId: string
  task: string
  data: any
  retryCount: number
  maxRetries: number
}

export class QueueService {
  private static QUEUE_KEY = 'app:queue:jobs'
  private static FAILED_KEY = 'app:queue:failed'

  static async GetStats() {
    if (!redis) {
      return {
        configured: false,
        queueDepth: null,
        failedDepth: null,
      }
    }

    try {
      const [queueDepth, failedDepth] = await Promise.all([
        redis.llen(this.QUEUE_KEY),
        redis.llen(this.FAILED_KEY),
      ])

      return {
        configured: true,
        queueDepth,
        failedDepth,
      }
    } catch (error) {
      logger.error('[Queue] Failed to read queue stats', { error })
      return {
        configured: true,
        queueDepth: null,
        failedDepth: null,
        error: error instanceof Error ? error.message : 'Unknown queue stats error',
      }
    }
  }

  /**
   * ส่งงานเข้าคิว
   * @param task ชื่อของงาน (เช่น 'send_email', 'calc_commission')
   * @param data ข้อมูลที่จะใช้ทำงาน
   * @param maxRetries จำนวนครั้งที่จะลองใหม่ถ้าพัง
   */
  static async Enqueue(task: string, data: any, maxRetries = 3) {
    if (!redis) {
      logger.warn('[Queue] Upstash Redis not configured. Job will run synchronously.', { task })
      // หากรันใน môi trường ที่ไม่มี Redis หรือ Development สามารถยิง event ดิบ/Sync ได้
      return null
    }

    const payload: JobPayload = {
      jobId: GenerateId(),
      task,
      data,
      retryCount: 0,
      maxRetries,
    }

    try {
      await redis.lpush(this.QUEUE_KEY, JSON.stringify(payload))
      logger.info('[Queue] Job enqueued', { jobId: payload.jobId, task })
      return payload.jobId
    } catch (error) {
      logger.error('[Queue] Failed to enqueue job', { error })
      throw error
    }
  }

  /**
   * สำหรับใช้ใน Worker Endpoint (เช่น `/api/jobs/worker`) นำงานออกมาทำ
   */
  static async Dequeue(): Promise<JobPayload | null> {
    if (!redis) return null
    const jobStr = await redis.rpop(this.QUEUE_KEY)
    if (!jobStr) return null
    return typeof jobStr === 'string' ? JSON.parse(jobStr) : jobStr
  }

  /**
   * เมื่อรันงานล้มเหลว
   */
  static async FailJob(job: JobPayload, errorMessage: string) {
    if (!redis) return

    if (job.retryCount < job.maxRetries) {
      // Retry นำกลับเข้าคิว
      job.retryCount++
      logger.warn(`[Queue] Job retry ${job.retryCount}/${job.maxRetries}`, { jobId: job.jobId })
      await redis.lpush(this.QUEUE_KEY, JSON.stringify(job))
    } else {
      // เกิน limit ละ ย้ายไป failed jobs table
      const failedJob = { ...job, error: errorMessage, failedAt: new Date().toISOString() }
      await redis.lpush(this.FAILED_KEY, JSON.stringify(failedJob))
      logger.error('[Queue] Job completely failed', { jobId: job.jobId, error: errorMessage })
    }
  }
}
