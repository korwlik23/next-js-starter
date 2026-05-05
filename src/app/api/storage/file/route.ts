import { NextRequest, NextResponse } from 'next/server'
import { GetStorageObject, VerifySignedStorageUrl } from '@/lib/storage'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Missing storage key' }, { status: 400 })
  }

  const isValid = VerifySignedStorageUrl({
    key,
    expires: request.nextUrl.searchParams.get('expires'),
    signature: request.nextUrl.searchParams.get('signature'),
  })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid or expired signed URL' }, { status: 403 })
  }

  try {
    const object = await GetStorageObject(key)
    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        'Content-Type': object.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    logger.error('Failed to read storage object', { error, key })
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
