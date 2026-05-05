import { withAuth } from '@/lib/authorize'
import { BillingService } from '@/modules/billing/service'
import { successResponse, badRequest, serverError } from '@/utils/api'
import { z } from 'zod'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
})

export const POST = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const body = await req.json()
      const parsed = checkoutSchema.safeParse(body)

      if (!parsed.success) {
        return badRequest('Invalid plan', parsed.error.flatten().fieldErrors as any)
      }
      const { plan } = parsed.data

      const tenantId = await BillingService.GetTenantIdByUserId(user.userId)
      if (!tenantId) {
        return badRequest('User is not assigned to a tenant')
      }

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings/billing`
      const session = await BillingService.CreateCheckoutSession(tenantId, plan, returnUrl)

      return successResponse({ url: session.url })
    } catch (err: any) {
      return serverError(err.message)
    }
  },
  { permission: 'billing.manage' }
)
