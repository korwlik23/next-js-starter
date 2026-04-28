import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    revalidateTag('translations', 'max')
    return NextResponse.json({ success: true, message: 'Cache revalidated' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
