import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { LOGIN_LOCK_DURATION_MS, LOGIN_LOCK_WINDOW_MS, MAX_LOGIN_FAILURES } from './constants'
import { normalizeEmail } from './tokens'

/**
 * การจำกัดจำนวนครั้งที่ล็อกอินล้มเหลว
 *
 * นับแยกตามคู่ (อีเมล, IP) เพื่อไม่ให้ผู้โจมตีจาก IP เดียวล็อกบัญชีของคนอื่นทิ้งได้
 * และไม่ให้ผู้โจมตีเปลี่ยน IP ไปเรื่อย ๆ เพื่อเลี่ยงการนับ
 */
function createLoginIdentifier(email: string, ipAddress?: string | null) {
  return `${normalizeEmail(email)}:${ipAddress || 'unknown'}`
}

/** โยน AUTH_LOGIN_LOCKED เมื่อยังอยู่ในช่วงถูกล็อก */
export async function assertLoginNotLocked(email: string, ipAddress?: string | null) {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { identifier: createLoginIdentifier(email, ipAddress) },
  })

  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    throw new Error('AUTH_LOGIN_LOCKED')
  }
}

/** บันทึกความล้มเหลวหนึ่งครั้ง และล็อกเมื่อครบเกณฑ์ */
export async function recordLoginFailure(email: string, ipAddress?: string | null) {
  const now = new Date()
  const identifier = createLoginIdentifier(email, ipAddress)
  const existing = await prisma.loginAttempt.findUnique({ where: { identifier } })
  const shouldResetWindow =
    !existing || now.getTime() - existing.firstFailedAt.getTime() > LOGIN_LOCK_WINDOW_MS
  const failureCount = shouldResetWindow ? 1 : existing.failureCount + 1
  const lockedUntil =
    failureCount >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) : null

  if (!existing) {
    await prisma.loginAttempt.create({
      data: {
        id: GenerateId(),
        identifier,
        email: normalizeEmail(email),
        ipAddress: ipAddress || null,
        failureCount,
        firstFailedAt: now,
        lockedUntil,
      },
    })
    return
  }

  await prisma.loginAttempt.update({
    where: { identifier },
    data: {
      email: normalizeEmail(email),
      ipAddress: ipAddress || null,
      failureCount,
      firstFailedAt: shouldResetWindow ? now : existing.firstFailedAt,
      lockedUntil,
    },
  })
}

/** ล้างประวัติความล้มเหลวหลังล็อกอินสำเร็จ ความล้มเหลวตรงนี้ไม่ควรทำให้ล็อกอินพัง */
export async function clearLoginFailures(email: string, ipAddress?: string | null) {
  try {
    await prisma.loginAttempt.deleteMany({
      where: { identifier: createLoginIdentifier(email, ipAddress) },
    })
  } catch (error) {
    logger.warn('Failed to clear login attempts', { error })
  }
}
