import { NextRequest } from 'next/server'
import { successResponse, unauthorized, forbidden, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { BillingService } from '@/modules/billing/service'
import { logger } from '@/lib/logger'
import { can } from '@/lib/permissions'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)

  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized(translate(locale, 'api.errors.unauthorized'))
    if (!can(user, 'billing.view')) return forbidden(translate(locale, 'api.errors.forbidden'))

    const tenantId = (user as any).tenantId
    if (tenantId) {
      const subscription = await BillingService.GetSubscription(tenantId)
      return successResponse(subscription)
    }

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
    return serverError(
      error instanceof Error ? error.message : translate(locale, 'api.errors.server')
    )
  }
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)

  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized(translate(locale, 'api.errors.unauthorized'))
    if (!can(user, 'billing.manage')) return forbidden(translate(locale, 'api.errors.forbidden'))

    const body = await request.json()
    const { action = 'checkout', plan } = body as {
      action?: 'checkout' | 'portal'
      plan?: string
    }

    const tenantId = (user as any).tenantId
    if (!tenantId) {
      return serverError(translate(locale, 'api.messages.tenantRequired'))
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/billing`

    if (action === 'portal') {
      const result = await BillingService.CreateCustomerPortalSession(tenantId, returnUrl)
      return successResponse(result, translate(locale, 'api.messages.billingPortalRedirect'))
    }

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return serverError(translate(locale, 'api.messages.invalidBillingPlan'))
    }

    const result = await BillingService.CreateCheckoutSession(tenantId, plan, returnUrl)
    return successResponse(result, translate(locale, 'api.messages.billingCheckoutRedirect'))
  } catch (error) {
    logger.error('[Billing API] POST error', { error })
    return serverError(
      error instanceof Error ? error.message : translate(locale, 'api.errors.server')
    )
  }
}
