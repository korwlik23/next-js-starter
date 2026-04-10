import { NextRequest } from 'next/server'
import {
  successResponse,
  createdResponse,
  badRequest,
  unauthorized,
  serverError,
} from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { CreateTenantSchema } from '@/modules/tenant/schema'
import { CreateTenantService, ListTenantsService } from '@/modules/tenant/service'

// ────────────────────────────────────────
// Tenant API — GET & POST /api/tenant
// ────────────────────────────────────────

/**
 * GET /api/tenant — ดึงรายการ tenants
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const search = searchParams.get('search') ?? undefined

    const result = await ListTenantsService({ page, limit, search })
    return successResponse(result)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}

/**
 * POST /api/tenant — สร้าง tenant ใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    // ตรวจสอบสิทธิ์ — เฉพาะ owner เท่านั้น
    if (!can(user, 'billing.manage')) {
      return badRequest('Forbidden')
    }

    const body = await request.json()
    const parsed = CreateTenantSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Validation error', {
        validation: parsed.error.issues.map((e) => e.message),
      })
    }

    const tenant = await CreateTenantService(parsed.data)
    return createdResponse(tenant)
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to create tenant')
  }
}
