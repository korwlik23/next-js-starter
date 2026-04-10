import prisma from '@/lib/prisma'

/**
 * ─────────────────────────────────────────
 * API Key Guard (For External Apps / Server-to-Server)
 * ใช้เพื่อตรวจสอบ Header `x-api-key` สิทธิ์ระดับ Tenant
 * ─────────────────────────────────────────
 */

/**
 * Hash API Key ด้วย SHA-256 (ง่ายต่อการใช้งานและมี Edge support)
 * @param key Plain text api key
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * ฟังก์ชันสำหรับการเช็ค API Key ใน Next.js Route Handler หรือ Middleware
 * ตัวอย่างการใช้ใน Route:  
 * const tenant = await validateApiKey(req.headers.get('x-api-key'))
 */
export async function validateApiKey(apiKey: string | null) {
  if (!apiKey) {
    return { isValid: false, tenant: null, error: 'API Key is missing' }
  }

  try {
    const hashedKey = await hashApiKey(apiKey)

    // ค้นหาใน DB
    const keyRecord = await prisma.apiKey.findUnique({
      where: { hashedKey },
      include: { tenant: true },
    })

    if (!keyRecord) {
      return { isValid: false, tenant: null, error: 'Invalid API Key' }
    }

    if (!keyRecord.isActive) {
      return { isValid: false, tenant: null, error: 'API Key has been disabled' }
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { isValid: false, tenant: null, error: 'API Key has expired' }
    }

    // อัปเดตเวลาการใช้งานล่าสุด (Optional: ควรใช้ระบบ Queue/Background เพื่อไม่ให้หน่วง Request หลัก)
    // แต่เพื่อความเรียบง่ายตอนนี้อัพเดททันทีเลย
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {})

    return { isValid: true, tenant: keyRecord.tenant, error: null }
  } catch (_error) {
    return { isValid: false, tenant: null, error: 'Internal Server Error' }
  }
}
