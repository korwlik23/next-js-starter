// ────────────────────────────────────────
// Sanitize — ฟังก์ชันทำความสะอาด input
// ป้องกัน XSS, injection, และข้อมูลที่ไม่ถูกต้อง
// ────────────────────────────────────────

/**
 * ลบ HTML tags ทั้งหมดออกจาก string
 * ใช้ป้องกัน XSS attacks
 */
export function SanitizeHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // ลบ HTML tags
    .replace(/&lt;/g, '<') // decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

/**
 * Escape HTML special characters เพื่อป้องกัน XSS
 * ใช้กับข้อมูลที่ต้องแสดงผลใน HTML
 */
export function EscapeHtml(input: string): string {
  const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
}

/**
 * ทำความสะอาด input ทั่วไป
 * - trim whitespace
 * - ลบ null bytes
 * - ลบ control characters (ยกเว้น newline, tab)
 */
export function SanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\0/g, '') // ลบ null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // ลบ control chars
}

/**
 * ทำความสะอาดทุก field ใน object (recursive)
 * sanitize เฉพาะ string fields
 */
export function SanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      ;(sanitized as Record<string, unknown>)[key] = SanitizeInput(SanitizeHtml(value))
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      ;(sanitized as Record<string, unknown>)[key] = SanitizeObject(
        value as Record<string, unknown>
      )
    }
  }

  return sanitized
}

/**
 * ป้องกัน SQL Injection — escape special chars สำหรับ SQL
 * หมายเหตุ: ควรใช้ parameterized queries (Prisma) เป็นหลัก
 */
export function SanitizeSql(input: string): string {
  return input.replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/;/g, '').replace(/--/g, '')
}

/**
 * ตรวจสอบและทำความสะอาด email
 */
export function SanitizeEmail(email: string): string {
  return SanitizeInput(email).toLowerCase()
}
