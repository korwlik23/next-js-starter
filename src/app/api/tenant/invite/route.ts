import { z } from 'zod'
import { withAuth } from '@/lib/authorize'
import { InviteUserService } from '@/modules/tenant/service'
import { successResponse, badRequest, forbidden, errorResponse } from '@/utils/api'

const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
  tenantId: z.string().min(1),
})

export const POST = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const body = await req.json()
      const parsed = inviteSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest('Invalid data', parsed.error.flatten().fieldErrors as any)
      }
      const { email, roleId, tenantId } = parsed.data

      const invite = await InviteUserService(user.userId, email, roleId, tenantId)
      return successResponse(invite, 'Invitation sent')
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        return forbidden()
      }
      return errorResponse(
        error.message || 'Internal server error',
        error.message?.includes('Invalid role') || error.message?.includes('already in this team')
          ? 400
          : 500
      )
    }
  },
  { permission: 'team.invite' }
)
