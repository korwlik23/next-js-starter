import { NextRequest } from 'next/server'
import { successResponse, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// Analytics API — ดึงสถิติการใช้งานจากข้อมูลจริง
// GET /api/analytics
// ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const now = new Date()
    const seven_days_ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ── ดึงข้อมูลแบบ parallel
    const [
      total_audit_logs_7d,
      total_users,
      active_users_count,
      daily_logs,
      module_stats,
    ] = await Promise.all([
      // จำนวน audit log ทั้งหมดใน 7 วัน (เทียบเท่า page views / api calls)
      prisma.auditLog.count({
        where: { createdAt: { gte: seven_days_ago } },
      }),

      // จำนวนผู้ใช้ทั้งหมด
      prisma.user.count({ where: { deletedAt: null } }),

      // Active users (มี refresh token ที่ยังไม่ expire)
      prisma.refreshToken.count({
        where: { expiresAt: { gt: now }, revokedAt: null },
      }),

      // จำนวน logs ต่อวัน (7 วัน) — group by date
      prisma.$queryRawUnsafe<{ log_date: string; count: bigint }[]>(
        `SELECT DATE(createdAt) as log_date, COUNT(*) as count
         FROM audit_logs
         WHERE createdAt >= ?
         GROUP BY DATE(createdAt)
         ORDER BY log_date ASC`,
        seven_days_ago
      ),

      // จำนวน logs ต่อ entity/module — group by entity
      prisma.$queryRawUnsafe<{ entity: string; count: bigint }[]>(
        `SELECT COALESCE(entity, 'Other') as entity, COUNT(*) as count
         FROM audit_logs
         WHERE createdAt >= ?
         GROUP BY entity
         ORDER BY count DESC
         LIMIT 10`,
        seven_days_ago
      ),
    ])

    // ── แปลง daily_logs ให้อ่านง่าย
    const day_names = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']
    const formatted_daily = daily_logs.map((d) => {
      const date = new Date(d.log_date)
      return {
        day: day_names[date.getDay()] ?? 'N/A',
        date: d.log_date,
        count: Number(d.count),
      }
    })

    // ── แปลง module_stats ให้เป็น percentage
    const total_module_count = module_stats.reduce((sum, m) => sum + Number(m.count), 0)
    const formatted_modules = module_stats.map((m) => ({
      module: m.entity || 'Other',
      requests: Number(m.count),
      percentage: total_module_count > 0
        ? Math.round((Number(m.count) / total_module_count) * 100)
        : 0,
    }))

    return successResponse({
      overview: {
        total_actions_7d: total_audit_logs_7d,
        total_users,
        active_users: active_users_count,
      },
      daily_activity: formatted_daily,
      module_usage: formatted_modules,
    })
  } catch (error) {
    logger.error('[Analytics API] Error', { error })
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}
