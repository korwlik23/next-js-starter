import { withAuth } from '@/lib/authorize'
import { successResponse, createdResponse, badRequest, serverError } from '@/utils/api'
import { CreateTenantSchema } from '@/modules/tenant/schema'
import { CreateTenantService, ListTenantsService } from '@/modules/tenant/service'

// ────────────────────────────────────────
// Tenant API — GET & POST /api/tenant
// ────────────────────────────────────────

/**
 * GET /api/tenant — ดึงรายการ tenants (เฉพาะ Admin)
 */
export const GET = withAuth(
  async (req: Request) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('limit')) || 10
      const search = searchParams.get('search') ?? undefined

      const result = await ListTenantsService({ page, limit, search })
      return successResponse(result)
    } catch (error) {
      return serverError(error instanceof Error ? error.message : 'Internal error')
    }
  },
  { permission: 'tenant.list' } // เปลี่ยนเป็นสิทธิ์เฉพาะ admin
)

/**
 * POST /api/tenant — สร้าง tenant ใหม่
 */
export const POST = withAuth(
  async (req: Request) => {
    try {
      const body = await req.json()
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
  },
  { permission: 'tenant.create' }
)
