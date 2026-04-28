import { NextRequest } from 'next/server'
import { successResponse, unauthorized, forbidden, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { BillingService } from '@/modules/billing/service'
import { logger } from '@/lib/logger'
import { can } from '@/lib/permissions'

// ────────────────────────────────────────
// Billing API — จัดการ subscription / checkout
// GET  → ดึงข้อมูล subscription ปัจจุบัน
// POST → สร้าง Stripe Checkout Session
// ────────────────────────────────────────

/**
 * GET /api/billing — ดึงข้อมูล billing ของ tenant
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()
    if (!can(user, 'billing.view')) return forbidden()

    // ถ้ามี tenantId → ดึง subscription จริง, ไม่มี → free plan
    const tenant_id = (user as any).tenantId
    if (tenant_id) {
      const subscription = await BillingService.GetSubscription(tenant_id)
      return successResponse(subscription)
    }

    // ผู้ใช้ไม่ได้อยู่ใน tenant ใดๆ → return free plan
    return successResponse({
      plan: 'free',
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      stripe_customer_id: null,
    })
  } catch (error) {
    logger.error('[Billing API] GET error', { error })
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}

/**
 * POST /api/billing — สร้าง Stripe Checkout Session หรือ Customer Portal
 * Body: { action: 'checkout' | 'portal', plan?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()
    if (!can(user, 'billing.manage')) return forbidden()

    const body = await request.json()
    const { action = 'checkout', plan } = body as {
      action?: 'checkout' | 'portal'
      plan?: string
    }

    const tenant_id = (user as any).tenantId
    if (!tenant_id) {
      return serverError('User must belong to a tenant to manage billing')
    }

    const return_url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings/billing`

    // ── สร้าง Customer Portal Session
    if (action === 'portal') {
      const result = await BillingService.CreateCustomerPortalSession(tenant_id, return_url)
      return successResponse(result, 'Redirecting to customer portal...')
    }

    // ── สร้าง Checkout Session
    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return serverError('Invalid plan. Available: pro, enterprise')
    }

    const result = await BillingService.CreateCheckoutSession(tenant_id, plan, return_url)
    return successResponse(result, 'Redirecting to checkout...')
  } catch (error) {
    logger.error('[Billing API] POST error', { error })
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}
