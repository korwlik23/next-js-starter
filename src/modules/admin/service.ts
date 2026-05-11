import prisma from '@/lib/prisma'
import { QueueService } from '@/lib/queue'

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

  static async getOpsSnapshot() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const requiredEnv = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'STORAGE_SIGNING_SECRET',
    ] as const
    const optionalIntegrations = [
      'RESEND_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'UPSTASH_REDIS_REST_URL',
      'S3_BUCKET',
      'SENTRY_DSN',
    ] as const

    const [
      activeSessions,
      expiredSessions,
      pendingWebhooks,
      failedWebhooks,
      recentWebhookFailures,
      queuedEmails,
      failedEmails,
      recentEmailFailures,
      uploadedFiles24h,
      queue,
    ] = await Promise.all([
      prisma.session.count({
        where: {
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
      }),
      prisma.session.count({
        where: {
          expiresAt: { lt: new Date() },
          revokedAt: null,
        },
      }),
      prisma.webhookEvent.count({ where: { status: 'pending' } }),
      prisma.webhookEvent.count({ where: { status: 'failed' } }),
      prisma.webhookEvent.findMany({
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          provider: true,
          eventId: true,
          eventType: true,
          createdAt: true,
        },
      }),
      prisma.emailLog.count({ where: { status: 'queued' } }),
      prisma.emailLog.count({ where: { status: 'failed' } }),
      prisma.emailLog.findMany({
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          to: true,
          subject: true,
          error: true,
          createdAt: true,
        },
      }),
      prisma.uploadedFile.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      QueueService.GetStats(),
    ])

    return {
      generated_at: new Date().toISOString(),
      runtime: {
        node_env: process.env.NODE_ENV ?? 'development',
        log_format: process.env.LOG_FORMAT ?? 'pretty',
        uptime_seconds: Math.round(process.uptime()),
      },
      readiness: {
        required_env: requiredEnv.map((key) => ({
          key,
          configured: Boolean(process.env[key]),
        })),
        optional_integrations: optionalIntegrations.map((key) => ({
          key,
          configured: Boolean(process.env[key]),
        })),
      },
      jobs: queue,
      sessions: {
        active: activeSessions,
        expired_not_revoked: expiredSessions,
      },
      webhooks: {
        pending: pendingWebhooks,
        failed: failedWebhooks,
        recent_failures: recentWebhookFailures.map((event) => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
        })),
      },
      emails: {
        queued: queuedEmails,
        failed: failedEmails,
        recent_failures: recentEmailFailures.map((email) => ({
          ...email,
          createdAt: email.createdAt.toISOString(),
        })),
      },
      storage: {
        uploaded_files_24h: uploadedFiles24h,
      },
      health_window: {
        since_1h: oneHourAgo.toISOString(),
        since_24h: twentyFourHoursAgo.toISOString(),
      },
    }
  }
}
