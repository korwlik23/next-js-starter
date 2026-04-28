import prisma from '@/lib/prisma'

/**
 * ────────────────────────────────────────────────────────
 * Idempotency Utility
 * ใช้ป้องกันการส่ง Request เดิมซ้ำๆ (เช่นการชำระเงิน หรือการสร้างข้อมูลที่สำคัญ)
 * ────────────────────────────────────────────────────────
 */

export async function checkIdempotency(key: string, requestHash: string, userId?: string) {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  })

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new Error('Idempotency key already used for a different request')
    }
    return {
      isNew: false,
      response: existing.response ? JSON.parse(existing.response) : null,
      status: existing.status,
    }
  }

  // Create new pending idempotency record
  await prisma.idempotencyKey.create({
    data: {
      key,
      requestHash,
      userId,
      status: 'pending',
    },
  })

  return { isNew: true, response: null, status: 'pending' }
}

export async function updateIdempotencyResult(
  key: string,
  responseObj: any,
  status: 'success' | 'failed'
) {
  await prisma.idempotencyKey.update({
    where: { key },
    data: {
      response: JSON.stringify(responseObj),
      status,
    },
  })
}
