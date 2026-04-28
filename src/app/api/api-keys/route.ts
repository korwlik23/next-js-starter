import { NextRequest } from 'next/server'
import { successResponse, badRequest, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { CreateApiKey, ListApiKeys, RevokeApiKey } from '@/lib/api-key'
import { can } from '@/lib/permissions'
import { z } from 'zod'

// ────────────────────────────────────────
// API KEY MANAGEMENT — /api/api-keys
// สร้าง, ดึงรายการ, และ revoke API keys
// ────────────────────────────────────────

const CreateKeySchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อ API Key').max(100),
})

/**
 * GET /api/api-keys — ดึงรายการ API keys ของ tenant
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    const tenant_id = user.tenantId
    if (!tenant_id) return badRequest('User is not assigned to a tenant')

    // ตรวจสอบสิทธิ์
    if (!can(user, 'settings.view')) {
      return badRequest('ไม่มีสิทธิ์ดู API Keys')
    }

    const keys = await ListApiKeys(tenant_id)
    return successResponse(keys)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}

/**
 * POST /api/api-keys — สร้าง API key ใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    if (!can(user, 'settings.update')) {
      return badRequest('ไม่มีสิทธิ์สร้าง API Key')
    }

    const body = await request.json()
    const parsed = CreateKeySchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Validation error', {
        validation: parsed.error.issues.map((i) => i.message),
      })
    }

    const tenant_id = user.tenantId
    if (!tenant_id) return badRequest('User is not assigned to a tenant')

    const result = await CreateApiKey(tenant_id, parsed.data.name, user.sub)

    return successResponse(result, 'สร้าง API Key เรียบร้อย')
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}

/**
 * DELETE /api/api-keys — Revoke API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    if (!can(user, 'settings.update')) {
      return badRequest('ไม่มีสิทธิ์ลบ API Key')
    }

    const { id } = await request.json()
    if (!id) return badRequest('ต้องระบุ API Key ID')

    const tenant_id = user.tenantId
    if (!tenant_id) return badRequest('User is not assigned to a tenant')

    const success = await RevokeApiKey(id, tenant_id)
    if (!success) return badRequest('ไม่สามารถ revoke API Key ได้')

    return successResponse(null, 'Revoke API Key เรียบร้อย')
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}
