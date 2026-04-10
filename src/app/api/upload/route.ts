import { NextRequest } from 'next/server'
import { successResponse, badRequest, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { ulid } from 'ulid'

// ────────────────────────────────────────
// Upload API — POST /api/upload
// รับ FormData พร้อม file → validate → บันทึก → return URL
// ────────────────────────────────────────

/** ประเภทไฟล์ที่อนุญาต */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]

/** ขนาดสูงสุด 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ auth
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return badRequest('Unauthorized')
    }

    // อ่าน FormData
    const form_data = await request.formData()
    const file = form_data.get('file') as File | null

    if (!file) {
      return badRequest('No file provided')
    }

    // ตรวจสอบประเภทไฟล์
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return badRequest(`File type not allowed: ${file.type}`)
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > MAX_FILE_SIZE) {
      return badRequest(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // สร้างชื่อไฟล์ที่ unique ด้วย ULID
    const file_extension = file.name.split('.').pop() ?? 'bin'
    const file_name = `${ulid()}.${file_extension}`

    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const upload_dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(upload_dir, { recursive: true })

    // อ่าน buffer และบันทึกไฟล์
    const buffer = Buffer.from(await file.arrayBuffer())
    const file_path = path.join(upload_dir, file_name)
    await writeFile(file_path, buffer)

    // Return URL path สำหรับเข้าถึงไฟล์
    const file_url = `/uploads/${file_name}`

    return successResponse(
      {
        url: file_url,
        name: file.name,
        size: file.size,
        type: file.type,
      },
      'File uploaded successfully'
    )
  } catch (error) {
    console.error('Upload error:', error)
    return serverError('Failed to upload file')
  }
}
