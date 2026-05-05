import { ProcessJob } from '@/lib/job-handlers'
import { EmailService } from '@/services/email.service'

jest.mock('@/services/email.service', () => ({
  EmailService: {
    SendEmail: jest.fn(),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('@/lib/prisma', () => ({
  session: {
    updateMany: jest.fn(),
  },
  webhookEvent: {
    deleteMany: jest.fn(),
  },
}))

describe('ProcessJob', () => {
  it('dispatches send_email jobs to EmailService', async () => {
    ;(EmailService.SendEmail as jest.Mock).mockResolvedValue({ success: true })

    const payload = {
      to: 'member@example.com',
      subject: 'Invite',
      html: '<p>Hello</p>',
    }

    const result = await ProcessJob('send_email', payload)

    expect(EmailService.SendEmail).toHaveBeenCalledWith(payload)
    expect(result).toEqual({ success: true })
  })

  it('skips unknown jobs without throwing', async () => {
    const result = await ProcessJob('unknown_task', { id: 'job_1' })

    expect(result).toEqual({ skipped: true, reason: 'unknown_task' })
    expect(EmailService.SendEmail).not.toHaveBeenCalled()
  })

  it('accepts project-specific queue jobs explicitly', async () => {
    const result = await ProcessJob('billing_sync', { tenantId: 'tenant_1' })

    expect(result).toEqual({ success: true, accepted: true, task: 'billing_sync' })
  })
})
