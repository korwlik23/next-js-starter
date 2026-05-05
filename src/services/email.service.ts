import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { SendProviderEmail, type SendEmailInput } from '@/lib/email'
import { QueueService } from '@/lib/queue'
import {
  GetPasswordResetTemplate,
  GetTeamInviteTemplate,
  GetWelcomeEmailTemplate,
} from './templates/email.templates'

export class EmailService {
  static async QueueEmail(input: SendEmailInput) {
    const jobId = await QueueService.Enqueue('send_email', input)
    if (jobId) {
      return { success: true, queued: true, jobId }
    }

    return this.SendEmail(input)
  }

  static async SendEmail({ to, subject, html, text, template }: SendEmailInput) {
    const recipients = Array.isArray(to) ? to.join(',') : to
    const emailLog = await prisma.emailLog
      .create({
        data: {
          id: GenerateId(),
          to: recipients,
          subject,
          template,
          status: 'queued',
          provider: process.env.EMAIL_PROVIDER || 'auto',
        },
      })
      .catch(() => null)

    try {
      const result = await SendProviderEmail({ to, subject, html, text, template })

      if (result.simulated) {
        logger.warn('Email provider is not configured. Simulating email sending:', { to, subject })
        if (emailLog) {
          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: 'simulated',
              provider: result.provider,
              sentAt: new Date(),
            },
          })
        }
        return { success: true, simulated: true }
      }

      logger.info('Email sent successfully', { to, subject, id: result.messageId })
      if (emailLog) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'sent',
            provider: result.provider,
            messageId: result.messageId,
            sentAt: new Date(),
          },
        })
      }
      return { success: true, data: result.raw }
    } catch (error: any) {
      logger.error('Failed to send email', { error, to, subject })
      if (emailLog) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          },
        })
      }
      return { success: false, error }
    }
  }

  static async SendWelcomeEmail(to: string, name: string) {
    const subject = `ยินดีต้อนรับสู่โปรเจคของเราคุณ ${name}!`
    const html = GetWelcomeEmailTemplate(name)
    return this.QueueEmail({ to, subject, html, template: 'welcome' })
  }

  static async SendPasswordResetEmail(to: string, resetToken: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

    const subject = 'รีเซ็ตรหัสผ่านของคุณ'
    const html = GetPasswordResetTemplate(resetUrl)
    return this.QueueEmail({ to, subject, html, template: 'password_reset' })
  }

  static async SendTeamInviteEmail(
    to: string,
    inviterName: string,
    tenantName: string,
    inviteToken: string
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite?token=${inviteToken}`

    const subject = `คุณ ${inviterName} ได้เชิญคุณเข้าร่วมทีม ${tenantName}`
    const html = GetTeamInviteTemplate(inviterName, tenantName, inviteUrl)
    return this.QueueEmail({ to, subject, html, template: 'team_invite' })
  }
}
