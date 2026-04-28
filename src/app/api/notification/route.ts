import { NextRequest } from 'next/server'
import { successResponse, serverError, unauthorized, badRequest } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────
// GET /api/notification
// ดึงรายการแจ้งเตือนสำหรับผู้ใช้งานปัจจุบัน
// ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    // รับ query limit
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const notifications = await prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    })

    return successResponse({ items: notifications, unreadCount })
  } catch (error) {
    logger.error('Fetch notifications error', { error })
    return serverError('เกิดข้อผิดพลาดในการดึงหน้าการแจ้งเตือน')
  }
}

// ─────────────────────────────────────────
// PATCH /api/notification
// อัปเดตสถานะการแจ้งเตือนเป็นอ่านแล้ว
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { notificationId, markAllRead } = body as {
      notificationId?: string
      markAllRead?: boolean
    }

    if (markAllRead) {
      // อ่านทั้งหมด
      await prisma.notification.updateMany({
        where: { userId: user.sub, isRead: false },
        data: { isRead: true },
      })
      return successResponse(null, 'เคลียร์การแจ้งเตือนทั้งหมดแล้ว')
    }

    if (!notificationId) {
      return badRequest('กรุณาระบุรหัสการแจ้งเตือน')
    }

    // ทำเครื่องหมายอ่านแล้วให้เฉพาะบางรายการ
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.sub },
      data: { isRead: true },
    })

    return successResponse(null, 'อัปเดตสถานะสำเร็จ')
  } catch (error) {
    logger.error('Update notification status error', { error })
    return serverError('เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน')
  }
}
