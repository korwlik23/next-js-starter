import type { NextRequest } from 'next/server'
import { successResponse, serverError } from '@/utils/api'
import { GetMembersAndInvitationsService } from '@/modules/tenant/service'
import { logger } from '@/lib/logger'
import { withAuth } from '@/lib/authorize'
import prisma from '@/lib/prisma'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export const GET = withAuth(
  async (req: Request, { user }: any) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
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
      return serverError(translate(locale, 'api.messages.teamMembersLoadError'))
    }
  },
  { permission: 'team.read' }
)
