// ────────────────────────────────────────
// Usage Limit — ระบบนับ/จำกัด usage ต่อ tenant
// ใช้ตรวจสอบว่า tenant ใช้ resource เกิน limit หรือไม่
// ────────────────────────────────────────

import prisma from '@/lib/prisma'
import { PLAN_LIMITS } from '@/lib/feature-gate'
import { logger } from '@/lib/logger'

interface UsageCheckResult {
  /** อนุญาตให้ทำได้หรือไม่ */
  is_allowed: boolean
  /** จำนวนที่ใช้ไปแล้ว */
  current_usage: number
  /** limit สูงสุด */
  max_limit: number
  /** จำนวนที่เหลือ */
  remaining: number
}

/**
 * ตรวจสอบจำนวน users ของ tenant
 */
export async function CheckUserLimit(tenant_id: string): Promise<UsageCheckResult> {
  try {
    // ดึง plan ปัจจุบันของ tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
    })

    const plan = tenant?.plan ?? 'free'
    const max_limit = PLAN_LIMITS[plan]?.max_users ?? 3

    // นับจำนวน users ที่ผูกกับ tenant นี้
    const current_usage = await prisma.userRole.count({
      where: { tenantId: tenant_id },
    })

    const remaining = Math.max(0, max_limit - current_usage)

    return {
      is_allowed: current_usage < max_limit,
      current_usage,
      max_limit,
      remaining,
    }
  } catch (error) {
    logger.error('[UsageLimit] Failed to check user limit', { error, tenant_id })
    // กรณี error — อนุญาตไว้ก่อน (fail open)
    return { is_allowed: true, current_usage: 0, max_limit: Infinity, remaining: Infinity }
  }
}

/**
 * ตรวจสอบจำนวน projects ของ tenant (ตัวอย่าง — ปรับ model ตามจริง)
 */
export async function CheckProjectLimit(tenant_id: string): Promise<UsageCheckResult> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
    })

    const plan = tenant?.plan ?? 'free'
    const max_limit = PLAN_LIMITS[plan]?.max_projects ?? 5

    // TODO: เปลี่ยน query ตาม model จริง — ตัวอย่างใช้ count invitations เป็น demo
    const current_usage = 0

    const remaining = Math.max(0, max_limit - current_usage)

    return {
      is_allowed: current_usage < max_limit,
      current_usage,
      max_limit,
      remaining,
    }
  } catch (error) {
    logger.error('[UsageLimit] Failed to check project limit', { error, tenant_id })
    return { is_allowed: true, current_usage: 0, max_limit: Infinity, remaining: Infinity }
  }
}

/**
 * ตรวจสอบขนาดไฟล์อัปโหลด (MB)
 */
export function CheckFileUploadLimit(plan: string, file_size_mb: number): boolean {
  const max_size = PLAN_LIMITS[plan]?.file_upload_size_mb ?? 10
  return file_size_mb <= max_size
}
