// ────────────────────────────────────────
// Trial System — ระบบทดลองใช้งาน
// จัดการ trial period + auto-downgrade
// ────────────────────────────────────────

import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PLANS } from '@/constants'

/** จำนวนวันทดลองใช้งาน */
const TRIAL_DURATION_DAYS = 14

/**
 * เริ่ม trial period สำหรับ tenant
 */
export async function StartTrial(tenant_id: string): Promise<{ trial_ends_at: Date }> {
  const trial_ends_at = new Date()
  trial_ends_at.setDate(trial_ends_at.getDate() + TRIAL_DURATION_DAYS)

  await prisma.tenant.update({
    where: { id: tenant_id },
    data: {
      plan: PLANS.PRO,
      trialEndsAt: trial_ends_at,
    },
  })

  logger.info(`[Trial] Started trial for tenant ${tenant_id}, ends at ${trial_ends_at.toISOString()}`)

  return { trial_ends_at }
}

/**
 * ตรวจสอบว่า tenant อยู่ในช่วง trial หรือไม่
 */
export async function IsInTrial(tenant_id: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenant_id },
    select: { trialEndsAt: true },
  })

  if (!tenant?.trialEndsAt) return false
  return new Date() < tenant.trialEndsAt
}

/**
 * ตรวจสอบว่า trial หมดอายุหรือยัง
 */
export async function IsTrialExpired(tenant_id: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenant_id },
    select: { trialEndsAt: true },
  })

  if (!tenant?.trialEndsAt) return false
  return new Date() >= tenant.trialEndsAt
}

/**
 * Downgrade tenant ที่ trial หมดอายุกลับเป็น free plan
 * สามารถเรียกผ่าน cron job หรือ scheduled task
 */
export async function DowngradeExpiredTrials(): Promise<number> {
  try {
    const now = new Date()

    // ค้นหา tenant ที่ trial หมดอายุแล้วแต่ยังไม่ได้ downgrade
    const expired_tenants = await prisma.tenant.findMany({
      where: {
        trialEndsAt: { lte: now },
        plan: { not: PLANS.FREE },
      },
      select: { id: true },
    })

    if (expired_tenants.length === 0) return 0

    // Batch downgrade เป็น free plan
    await prisma.tenant.updateMany({
      where: {
        id: { in: expired_tenants.map((t) => t.id) },
      },
      data: {
        plan: PLANS.FREE,
        trialEndsAt: null,
      },
    })

    logger.info(`[Trial] Downgraded ${expired_tenants.length} expired trials to free plan`)
    return expired_tenants.length
  } catch (error) {
    logger.error('[Trial] Failed to downgrade expired trials', { error })
    return 0
  }
}

/**
 * คำนวณจำนวนวันที่เหลือของ trial
 */
export function GetTrialDaysRemaining(trial_ends_at: Date | null): number {
  if (!trial_ends_at) return 0
  const diff = trial_ends_at.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
