import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

export class IdempotencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdempotencyError'
  }
}

/**
 * ────────────────────────────────────────
 * Idempotency Service
 * ป้องกันการทำรายการซ้ำซ้อน (เช่น การจ่ายเงิน, ตัดสต็อก)
 * โดยการใช้ Idempotency-Key
 * ────────────────────────────────────────
 */
export class IdempotencyService {
  /**
   * สร้าง Request Hash (SHA-256) จาก Payload ตัดปัญหาคนตั้งใจใช้คีย์ซ้ำกับ payload ข้อมูลใหม่
   */
  static HashRequest(payload: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  }

  /**
   * ตรวจสอบ Idempotency Key ก่อนเริ่มทำงาน
   * @returns status ('new' | 'completed') และค่า response หากเคยทำงานไปแล้ว
   * @throws IdempotencyError ถ้า payload ไม่ตรง หรือกำลังทำงานอยู่
   */
  static async BeginRequest(key: string, payload: any, userId?: string) {
    if (!key) return { status: 'new' } // ข้ามการเช็คถ้าไม่ต้องใช้ระบบนี้

    const hash = this.HashRequest(payload)

    try {
      const record = await prisma.idempotencyKey.findUnique({ where: { key } })

      if (record) {
        // คีย์เดิม แต่ payload เปลี่ยน = ไม่อนุญาต
        if (record.requestHash !== hash) {
          throw new IdempotencyError('Idempotency key already used with different payload')
        }
        // เคยทำสำเร็จแล้ว คืนค่าเดิมทันที
        if (record.status === 'completed') {
          return {
            status: 'completed',
            response: record.response ? JSON.parse(record.response) : null,
          }
        }
        // กำลังทำงานอยู่ ให้ Client รอ (กันรัวคลิก)
        if (record.status === 'pending') {
          throw new IdempotencyError('Request already in progress')
        }
        // ถ้าระบบเคยพ่น error (failed) เราอนุญาตให้ Retry ใหม่
      }

      // Upsert: สร้างใหม่ หรือ อัปเดต failed เป็น pending
      await prisma.idempotencyKey.upsert({
        where: { key },
        create: {
          key,
          userId,
          requestHash: hash,
          status: 'pending',
        },
        update: {
          status: 'pending',
          requestHash: hash,
        },
      })

      return { status: 'new' }
    } catch (err) {
      if (err instanceof IdempotencyError) throw err
      logger.error('[Idempotency] Failed to acquire lock', { error: err })
      throw new IdempotencyError('Failed to acquire idempotency lock')
    }
  }

  /**
   * บันทึกการทำงานสำเร็จ เก็บค่า Response สำรองเผื่อ Client ขอซ้ำ
   */
  static async CompleteRequest(key: string, response: any) {
    if (!key) return
    try {
      await prisma.idempotencyKey.update({
        where: { key },
        data: {
          status: 'completed',
          response: JSON.stringify(response),
        },
      })
    } catch (error) {
      logger.error('[Idempotency] Failed to mark request as complete', { error })
    }
  }

  /**
   * อัปเดตเมื่อเกิด Error ระหว่างกระบวนการ เพื่อให้สามารถ Retry ได้
   */
  static async FailRequest(key: string) {
    if (!key) return
    try {
      await prisma.idempotencyKey.update({
        where: { key },
        data: {
          status: 'failed',
        },
      })
    } catch (error) {
      logger.error('[Idempotency] Failed to mark request as failed', { error })
    }
  }
}
