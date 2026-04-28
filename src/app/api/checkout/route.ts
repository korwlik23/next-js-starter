import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAuth } from '@/lib/authorize'
import { BillingService } from '@/modules/billing/service'

export const POST = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const { plan } = await req.json()

      if (!plan || !['pro', 'enterprise'].includes(plan)) {
        return NextResponse.json({ success: false, message: 'Invalid plan' }, { status: 400 })
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      })
      if (!currentUser?.tenantId) {
        return NextResponse.json(
          { success: false, message: 'User is not assigned to a tenant' },
          { status: 400 }
        )
      }

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings/billing`
      const session = await BillingService.CreateCheckoutSession(
        currentUser.tenantId,
        plan,
        returnUrl
      )

      return NextResponse.json({ success: true, url: session.url })
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
  },
  { permission: 'billing.manage' }
)
