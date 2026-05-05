import { successResponse, serverError, badRequest } from '@/utils/api'
import { GetAllTranslations, UpsertTranslation } from '@/modules/translation/service'
import { z } from 'zod'

// ────────────────────────────────────────
// /api/admin/translations — CRUD คำแปล
// ────────────────────────────────────────

const TranslationSchema = z.object({
  locale: z.string().min(1),
  namespace: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined

    const translations = await GetAllTranslations(locale)
    return successResponse(translations)
  } catch (error) {
    console.error('[Translations GET Error]', error)
    // Fallback: ส่งคืน Array เปล่าเมื่อ Database ยังไม่พร้อม
    return serverError('Database connection failed or not seeded.')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = TranslationSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Missing required fields', parsed.error.flatten().fieldErrors as any)
    }

    const result = await UpsertTranslation(parsed.data)
    return successResponse(result)
  } catch (error) {
    console.error('[Translations POST Error]', error)
    return serverError('Internal Server Error')
  }
}
