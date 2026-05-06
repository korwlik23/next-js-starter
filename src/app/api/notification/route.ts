import type { NextRequest } from 'next/server'
import { successResponse, serverError, badRequest } from '@/utils/api'
import { NotificationService } from '@/modules/notification/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import { getLocaleFromRequest, translate } from '@/i18n/server'
import { z } from 'zod'

const patchNotificationSchema = z.object({
  notificationId: z.string().optional(),
  markAllRead: z.boolean().optional(),
})

export const GET = withAuth(async (req: Request, { user }: any) => {
  const locale = getLocaleFromRequest(req as NextRequest)

  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const data = await NotificationService.getNotifications(user.userId, limit)
    return successResponse(data)
  } catch (error) {
    logger.error('Fetch notifications error', { error })
    return serverError(translate(locale, 'api.messages.notificationLoadError'))
  }
})

export const PATCH = withAuth(async (req: Request, { user }: any) => {
  const locale = getLocaleFromRequest(req as NextRequest)

  try {
    const body = await req.json()
    const parsed = patchNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(
        translate(locale, 'api.errors.validation'),
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { notificationId, markAllRead } = parsed.data

    if (markAllRead) {
      await NotificationService.markAllAsRead(user.userId)
      return successResponse(null, translate(locale, 'api.messages.notificationsCleared'))
    }

    if (!notificationId) {
      return badRequest(translate(locale, 'api.messages.notificationIdRequired'))
    }

    await NotificationService.markAsRead(user.userId, notificationId)
    return successResponse(null, translate(locale, 'api.messages.notificationUpdated'))
  } catch (error) {
    logger.error('Update notification status error', { error })
    return serverError(translate(locale, 'api.messages.notificationUpdateError'))
  }
})
