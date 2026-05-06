import { NextRequest } from 'next/server'
import { successResponse, badRequest, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { CreateApiKey, ListApiKeys, RevokeApiKey } from '@/lib/api-key'
import { can } from '@/lib/permissions'
import { getLocaleFromRequest, translate } from '@/i18n/server'
import { z } from 'zod'

function createKeySchema(message: string) {
  return z.object({
    name: z.string().min(1, message).max(100),
  })
}

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = (key: string) => translate(locale, key)

  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized(t('api.errors.unauthorized'))

    const tenantId = user.tenantId
    if (!tenantId) return badRequest(t('api.messages.tenantRequired'))

    if (!can(user, 'settings.view')) {
      return badRequest(t('api.messages.apiKeysViewForbidden'))
    }

    const keys = await ListApiKeys(tenantId)
    return successResponse(keys)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : t('api.errors.server'))
  }
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = (key: string) => translate(locale, key)

  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized(t('api.errors.unauthorized'))

    if (!can(user, 'settings.update')) {
      return badRequest(t('api.messages.apiKeysCreateForbidden'))
    }

    const body = await request.json()
    const parsed = createKeySchema(t('api.messages.apiKeyNameRequired')).safeParse(body)

    if (!parsed.success) {
      return badRequest(t('api.errors.validation'), {
        validation: parsed.error.issues.map((issue) => issue.message),
      })
    }

    const tenantId = user.tenantId
    if (!tenantId) return badRequest(t('api.messages.tenantRequired'))

    const result = await CreateApiKey(tenantId, parsed.data.name, user.sub)

    return successResponse(result, t('api.messages.apiKeyCreated'))
  } catch (error) {
    return serverError(error instanceof Error ? error.message : t('api.errors.server'))
  }
}

export async function DELETE(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = (key: string) => translate(locale, key)

  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized(t('api.errors.unauthorized'))

    if (!can(user, 'settings.update')) {
      return badRequest(t('api.messages.apiKeysDeleteForbidden'))
    }

    const { id } = await request.json()
    if (!id) return badRequest(t('api.messages.apiKeyIdRequired'))

    const tenantId = user.tenantId
    if (!tenantId) return badRequest(t('api.messages.tenantRequired'))

    const success = await RevokeApiKey(id, tenantId)
    if (!success) return badRequest(t('api.messages.apiKeyRevokeFailed'))

    return successResponse(null, t('api.messages.apiKeyRevoked'))
  } catch (error) {
    return serverError(error instanceof Error ? error.message : t('api.errors.server'))
  }
}
