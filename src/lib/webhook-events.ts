import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'

export async function BeginWebhookEvent(input: {
  provider: string
  eventId: string
  eventType: string
  payload?: unknown
}) {
  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId: input.eventId,
      },
    },
  })

  if (existing?.status === 'processed') {
    return { shouldProcess: false, event: existing }
  }

  const event = await prisma.webhookEvent.upsert({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId: input.eventId,
      },
    },
    create: {
      id: GenerateId(),
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      payload: input.payload === undefined ? undefined : JSON.parse(JSON.stringify(input.payload)),
      status: 'processing',
    },
    update: {
      eventType: input.eventType,
      payload: input.payload === undefined ? undefined : JSON.parse(JSON.stringify(input.payload)),
      status: 'processing',
    },
  })

  return { shouldProcess: true, event }
}

export async function CompleteWebhookEvent(provider: string, eventId: string) {
  await prisma.webhookEvent.update({
    where: {
      provider_eventId: { provider, eventId },
    },
    data: {
      status: 'processed',
      processedAt: new Date(),
    },
  })
}

export async function FailWebhookEvent(provider: string, eventId: string) {
  await prisma.webhookEvent.update({
    where: {
      provider_eventId: { provider, eventId },
    },
    data: { status: 'failed' },
  })
}
