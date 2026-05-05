import { logger } from '@/lib/logger'

interface CaptureErrorInput {
  error: unknown
  message?: string
  context?: unknown
}

export function CaptureError({ error, message, context }: CaptureErrorInput) {
  if (!process.env.SENTRY_DSN) {
    return
  }

  // This project keeps Sentry optional. Install @sentry/nextjs and replace this
  // hook with Sentry.captureException when production monitoring is enabled.
  logger.debug('[ErrorMonitoring] Captured error for external monitoring', {
    message,
    context,
    error: error instanceof Error ? { name: error.name, message: error.message } : error,
  })
}
