import { successResponse, serverError, badRequest } from '@/utils/api'
import { NotificationService } from '@/modules/notification/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import { z } from 'zod'

const patchNotificationSchema = z.object({
  notificationId: z.string().optional(),
  markAllRead: z.boolean().optional(),
})

// ─────────────────────────────────────────
// GET /api/notification
// ดึงรายการแจ้งเตือนสำหรับผู้ใช้งานปัจจุบัน
// ─────────────────────────────────────────
export const GET = withAuth(async (req: Request, { user }: any) => {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const data = await NotificationService.getNotifications(user.userId, limit)
    return successResponse(data)
  } catch (error) {
    logger.error('Fetch notifications error', { error })
    return serverError('เกิดข้อผิดพลาดในการดึงหน้าการแจ้งเตือน')
  }
})

// ─────────────────────────────────────────
// PATCH /api/notification
// อัปเดตสถานะการแจ้งเตือนเป็นอ่านแล้ว
// ─────────────────────────────────────────
export const PATCH = withAuth(async (req: Request, { user }: any) => {
  try {
    const body = await req.json()
    const parsed = patchNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('ข้อมูลไม่ถูกต้อง', parsed.error.flatten().fieldErrors as any)
    }

    const { notificationId, markAllRead } = parsed.data

    if (markAllRead) {
      await NotificationService.markAllAsRead(user.userId)
      return successResponse(null, 'เคลียร์การแจ้งเตือนทั้งหมดแล้ว')
    }

    if (!notificationId) {
      return badRequest('กรุณาระบุรหัสการแจ้งเตือน')
    }

    await NotificationService.markAsRead(user.userId, notificationId)
    return successResponse(null, 'อัปเดตสถานะสำเร็จ')
  } catch (error) {
    logger.error('Update notification status error', { error })
    return serverError('เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน')
  }
})
