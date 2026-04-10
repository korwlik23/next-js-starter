import { NextRequest, NextResponse } from 'next/server'
import { BillingService } from './service'
import { checkoutSchema } from './schema'

// ────────────────────────────────────────
// Billing Controller
// ────────────────────────────────────────

export class BillingController {
  
  static async HandleCreateCheckout(req: NextRequest) {
    try {
      const body = await req.json()
      const parseResult = checkoutSchema.safeParse(body)

      if (!parseResult.success) {
        return NextResponse.json({ success: false, errors: parseResult.error.issues }, { status: 400 })
      }

      // ดึง returnUrl จาก Origin Request หรือ Environment
      const returnUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const session = await BillingService.CreateCheckoutSession(
        parseResult.data.tenantId,
        parseResult.data.plan,
        `${returnUrl}/settings/billing`
      )

      return NextResponse.json({ success: true, url: session.url })
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
  }

  static async HandleWebhook(req: NextRequest) {
    // รับ raw body แล้ว dispatch ไปยัง handler ที่เหมาะสมตาม event type
    try {
      const payload = await req.text()
      const event = JSON.parse(payload) // ในการใช้งานจริงต้องผ่าน stripe.webhooks.constructEvent

      // Dispatch event ไปยัง handler ที่เหมาะสม
      switch (event.type) {
        case 'checkout.session.completed':
          await BillingService.HandleCheckoutCompleted(event.data.object)
          break
        case 'customer.subscription.updated':
          await BillingService.HandleSubscriptionUpdated(event.data.object)
          break
        case 'customer.subscription.deleted':
          await BillingService.HandleSubscriptionDeleted(event.data.object)
          break
      }

      return NextResponse.json({ received: true })
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
  }
}
