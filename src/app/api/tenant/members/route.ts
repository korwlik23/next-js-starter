import { NextRequest } from 'next/server'
import { successResponse, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────
// GET /api/tenant/members
// ดึงรายการสมาชิกใน Tenant ปัจจุบัน + Pending Invitations
// ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const tenantId = (user as any).tenantId
    if (!tenantId) {
      return successResponse({ members: [], invitations: [] })
    }

    // 1. ดึงข้อมูลสมาชิก (Users ที่มี role ใน tenant นี้)
    const members = await prisma.userRole.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. ดึงข้อมูลการเชิญที่ยังค้างอยู่ (Pending Invitations)
    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({
      members: members.map((m) => ({
        ...m.user,
        role: m.role.name,
      })),
      invitations,
    })
  } catch (error) {
    logger.error('Fetch tenant members error', { error })
    return serverError('เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกทีม')
  }
}
