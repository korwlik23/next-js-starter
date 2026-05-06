import type { NextRequest } from 'next/server'
import { withAuth } from '@/lib/authorize'
import { successResponse, createdResponse, badRequest, serverError } from '@/utils/api'
import { CreateTenantSchema } from '@/modules/tenant/schema'
import { CreateTenantService, ListTenantsService } from '@/modules/tenant/service'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export const GET = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('limit')) || 10
      const search = searchParams.get('search') ?? undefined

      const result = await ListTenantsService({ page, limit, search })
      return successResponse(result)
    } catch (error) {
      return serverError(
        error instanceof Error ? error.message : translate(locale, 'api.errors.server')
      )
    }
  },
  { permission: 'tenant.list' }
)

export const POST = withAuth(
  async (req: Request) => {
    const locale = getLocaleFromRequest(req as NextRequest)

    try {
      const body = await req.json()
      const parsed = CreateTenantSchema.safeParse(body)

      if (!parsed.success) {
        return badRequest(translate(locale, 'api.errors.validation'), {
          validation: parsed.error.issues.map((issue) => issue.message),
        })
      }

      const tenant = await CreateTenantService(parsed.data)
      return createdResponse(tenant)
    } catch (error) {
      return badRequest(
        error instanceof Error
          ? error.message
          : translate(locale, 'api.messages.tenantCreateFailed')
      )
    }
  },
  { permission: 'tenant.create' }
)
