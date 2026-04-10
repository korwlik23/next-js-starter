import { NextRequest } from 'next/server'
import { successResponse, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ─────────────────────────────────────────
// NOTIFICATION SYSTEM API
// ─────────────────────────────────────────

/**
 * GET /api/notification — ดึงรายการแจ้งเตือนของ user ที่ล็อกอิน
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    // รับ parameter หน้าเพื่อการทำ pagination (Optional)
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 20

    const notifications = await prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    })

    return successResponse({ notifications, unreadCount })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}

/**
 * PUT /api/notification — ควบคุมการอัปเดตการอ่าน (Mark as read)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { notificationId, markAll } = body as { notificationId?: string; markAll?: boolean }

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.sub, isRead: false },
        data: { isRead: true },
      })
      return successResponse(null, 'ทำเครื่องหมายอ่านแล้วทั้งหมด')
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: user.sub }, // ให้แน่ใจว่าเป็นของตัวเอง
        data: { isRead: true },
      })
      return successResponse(null, 'ทำเครื่องหมายอ่านแล้ว')
    }

    return successResponse(null, 'ไม่พบการเปลี่ยนแปลงใดๆ')
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}
