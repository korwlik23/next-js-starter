import { successResponse, serverError } from '@/utils/api'
import { GetMembersAndInvitationsService } from '@/modules/tenant/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import prisma from '@/lib/prisma'

export const GET = withAuth(
  async (req: Request, { user }: any) => {
    try {
      // Find tenantId for this user
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      })
      const tenantId = currentUser?.tenantId

      if (!tenantId) {
        return successResponse({ members: [], invitations: [] })
      }

      const data = await GetMembersAndInvitationsService(tenantId)
      return successResponse(data)
    } catch (error) {
      logger.error('Fetch tenant members error', { error })
      return serverError('เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกทีม')
    }
  },
  { permission: 'team.read' }
)
