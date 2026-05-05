import { revalidateTag } from 'next/cache'
import { successResponse, serverError } from '@/utils/api'

export async function POST() {
  try {
    revalidateTag('translations', 'max')
    return successResponse(null, 'Cache revalidated')
  } catch {
    return serverError('Failed to revalidate')
  }
}
