import { EmailService } from '@/services/email.service'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'

export async function ProcessJob(task: string, data: unknown) {
  switch (task) {
    case 'send_email': {
      const payload = data as {
        to: string | string[]
        subject: string
        html?: string
        text?: string
      }
      return EmailService.SendEmail(payload)
    }

    case 'cleanup_expired_sessions': {
      const result = await prisma.session.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      })
      return { success: true, revokedSessions: result.count }
    }

    case 'cleanup_processed_webhooks': {
      const payload = data as { olderThanDays?: number }
      const olderThanDays = payload.olderThanDays ?? 30
      const before = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
      const result = await prisma.webhookEvent.deleteMany({
        where: {
          status: 'processed',
          processedAt: { lt: before },
        },
      })
      return { success: true, deletedWebhookEvents: result.count }
    }

    case 'billing_sync':
    case 'usage_calculation':
    case 'report_generation':
    case 'notification_fanout':
    case 'file_processing':
    case 'reconciliation': {
      logger.info('[Queue] Job accepted for project-specific implementation', { task, data })
      return { success: true, accepted: true, task }
    }

    default:
      logger.warn('[Queue] Unknown job task', { task })
      return { skipped: true, reason: 'unknown_task' }
  }
}
