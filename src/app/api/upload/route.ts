import { NextRequest } from 'next/server'
import { successResponse, badRequest, unauthorized, serverError } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { ulid } from 'ulid'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ────────────────────────────────────────
// Upload API — POST /api/upload
// รับ FormData พร้อม file → validate → บันทึก → return URL
// ────────────────────────────────────────

/** ประเภทไฟล์ที่อนุญาต */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

/** ขนาดสูงสุด 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ auth
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return unauthorized()
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

    const buffer = Buffer.from(await file.arrayBuffer())
    let file_url = ''

    // ตรวจสอบว่ามีการตั้งค่า AWS S3 หรือ R2 หรือไม่
    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env

    if (AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_S3_BUCKET) {
      // ─── อัปโหลดไป S3 หรือ Cloudflare R2 ───
      // หากใช้ R2 ต้องใส่ S3_ENDPOINT เพิ่ม
      const endpoint = process.env.S3_ENDPOINT

      const s3Client = new S3Client({
        region: AWS_REGION,
        ...(endpoint && { endpoint }),
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      })

      const uploadParams = {
        Bucket: AWS_S3_BUCKET,
        Key: `uploads/${file_name}`,
        Body: buffer,
        ContentType: file.type,
      }

      await s3Client.send(new PutObjectCommand(uploadParams))

      const storage_domain =
        process.env.NEXT_PUBLIC_STORAGE_URL ||
        `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
      file_url = `${storage_domain}/uploads/${file_name}`
    } else {
      // ─── อัปโหลดลง Local (Fallback) ───
      const upload_dir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(upload_dir, { recursive: true })

      const file_path = path.join(upload_dir, file_name)
      await writeFile(file_path, buffer)

      file_url = `/uploads/${file_name}`
    }

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
