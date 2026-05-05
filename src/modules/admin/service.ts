import prisma from '@/lib/prisma'

export class AdminService {
  static async getAdminStats() {
    // ดึง stats จาก DB แบบ parallel เพื่อประสิทธิภาพ
    const [total_users, total_tenants, active_users, recent_logs] = await Promise.all([
      // จำนวนผู้ใช้ทั้งหมด (ไม่นับ soft-deleted)
      prisma.user.count({
        where: { deletedAt: null },
      }),

      // จำนวน tenants ที่ active
      prisma.tenant.count({
        where: { isActive: true, deletedAt: null },
      }),

      // จำนวน users ที่มี refreshToken ยังไม่ expire (ถือว่า active)
      prisma.refreshToken.count({
        where: {
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
      }),

      // เหตุการณ์ล่าสุด 10 รายการจาก audit log
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    // คำนวณจำนวน API requests ใน 24 ชั่วโมงที่ผ่านมา (จาก audit log)
    const twenty_four_hours_ago = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const api_requests_24h = await prisma.auditLog.count({
      where: { createdAt: { gte: twenty_four_hours_ago } },
    })

    // แปลง recent_logs ให้อ่านง่าย
    const formatted_events = recent_logs.map((log) => ({
      id: log.id,
      action: log.action,
      detail: log.entity ? `${log.entity}${log.entityId ? `: ${log.entityId}` : ''}` : '-',
      user_name: log.user?.name ?? 'System',
      user_email: log.user?.email ?? '',
      created_at: log.createdAt.toISOString(),
    }))

    return {
      stats: {
        total_users,
        total_tenants,
        active_sessions: active_users,
        api_requests_24h,
      },
      recent_events: formatted_events,
    }
  }
}
