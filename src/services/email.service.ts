import { Resend } from 'resend'
import { logger } from '@/lib/logger'
import { GetWelcomeEmailTemplate, GetPasswordResetTemplate, GetTeamInviteTemplate } from './templates/email.templates'

// ─────────────────────────────────────────
// EMAIL SERVICE (Resend)
// ─────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')
const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@yourdomain.com'

export class EmailService {
  /**
   * ส่งอีเมลพื้นฐาน (General Purpose)
   */
  static async SendEmail({
    to,
    subject,
    html,
    text,
  }: {
    to: string | string[]
    subject: string
    html?: string
    text?: string
  }) {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY is not set. Simulating email sending:', { to, subject })
      return { success: true, simulated: true }
    }

    try {
      const data = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to,
        subject,
        html: html || '',
        text: text || '',
      })
      logger.info('Email sent successfully', { to, subject, id: data.data?.id })
      return { success: true, data }
    } catch (error: any) {
      logger.error('Failed to send email', { error, to, subject })
      return { success: false, error }
    }
  }

  static async SendWelcomeEmail(to: string, name: string) {
    const subject = `ยินดีต้อนรับสู่โปรเจคของเราคุณ ${name}!`
    const html = GetWelcomeEmailTemplate(name)
    return this.SendEmail({ to, subject, html })
  }

  static async SendPasswordResetEmail(to: string, resetToken: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/forgot-password?token=${resetToken}`
    
    const subject = 'รีเซ็ตรหัสผ่านของคุณ'
    const html = GetPasswordResetTemplate(resetUrl)
    return this.SendEmail({ to, subject, html })
  }

  static async SendTeamInviteEmail(to: string, inviterName: string, tenantName: string, inviteToken: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite?token=${inviteToken}`
    
    const subject = `คุณ ${inviterName} ได้เชิญคุณเข้าร่วมทีม ${tenantName}`
    const html = GetTeamInviteTemplate(inviterName, tenantName, inviteUrl)
    return this.SendEmail({ to, subject, html })
  }
}
