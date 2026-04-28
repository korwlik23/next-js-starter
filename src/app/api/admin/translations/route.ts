import { NextResponse } from 'next/server'
import { GetAllTranslations, UpsertTranslation } from '@/modules/translation/service'

// ────────────────────────────────────────
// /api/admin/translations — CRUD คำแปล
// ────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // กำหนดสิทธิ์ชั่วคราวเป็น admin
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined

    const translations = await GetAllTranslations(locale)
    return NextResponse.json(translations, { status: 200 })
  } catch (error) {
    console.error('[Translations GET Error]', error)
    // Fallback: ส่งคืน Array เปล่าเมื่อ Database ยังไม่พร้อม
    return NextResponse.json(
      { data: [], error: 'Database connection failed or not seeded.' },
      { status: 200 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { locale, namespace, key, value } = body

    if (!locale || !namespace || !key || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await UpsertTranslation({ locale, namespace, key, value })

    return NextResponse.json({ success: true, translation: result }, { status: 200 })
  } catch (error) {
    console.error('[Translations POST Error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
