import { Resend } from 'resend'

export type EmailProviderName = 'resend' | 'postmark' | 'smtp' | 'simulated'

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
}

export interface SendEmailResult {
  provider: EmailProviderName
  messageId?: string
  simulated?: boolean
  raw?: unknown
}

const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@yourdomain.com'

function getProviderName(): EmailProviderName {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase()

  if (provider === 'postmark' || provider === 'smtp' || provider === 'resend') {
    return provider
  }

  if (process.env.POSTMARK_SERVER_TOKEN) return 'postmark'
  if (process.env.RESEND_API_KEY) return 'resend'
  return 'simulated'
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { provider: 'simulated', simulated: true }
  }

  const resend = new Resend(apiKey)
  const response = await resend.emails.send({
    from: DEFAULT_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html || '',
    text: input.text || '',
  })

  return {
    provider: 'resend',
    messageId: response.data?.id,
    raw: response,
  }
}

async function sendWithPostmark(input: SendEmailInput): Promise<SendEmailResult> {
  const token = process.env.POSTMARK_SERVER_TOKEN
  if (!token) {
    return { provider: 'simulated', simulated: true }
  }

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token,
    },
    body: JSON.stringify({
      From: DEFAULT_FROM_EMAIL,
      To: Array.isArray(input.to) ? input.to.join(',') : input.to,
      Subject: input.subject,
      HtmlBody: input.html,
      TextBody: input.text,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.Message || `Postmark send failed with status ${response.status}`)
  }

  return {
    provider: 'postmark',
    messageId: data?.MessageID,
    raw: data,
  }
}

async function sendWithSmtp(): Promise<SendEmailResult> {
  if (!process.env.SMTP_HOST) {
    return { provider: 'simulated', simulated: true }
  }

  throw new Error('SMTP provider is configured but no SMTP transport adapter is installed')
}

export async function SendProviderEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = getProviderName()

  switch (provider) {
    case 'postmark':
      return sendWithPostmark(input)
    case 'smtp':
      return sendWithSmtp()
    case 'resend':
      return sendWithResend(input)
    default:
      return { provider: 'simulated', simulated: true }
  }
}
