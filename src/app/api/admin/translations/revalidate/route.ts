import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { successResponse, serverError } from '@/utils/api'
import { getLocaleFromRequest, translate } from '@/i18n/server'

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)

  try {
    revalidateTag('translations', 'max')
    return successResponse(null, translate(locale, 'api.messages.translationCacheRevalidated'))
  } catch {
    return serverError(translate(locale, 'api.messages.translationCacheRevalidateFailed'))
  }
}
