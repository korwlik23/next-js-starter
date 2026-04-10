import { ulid } from 'ulid'

// ────────────────────────────────────────
// ULID Generator — สร้าง ID ที่ unique + sortable by time
// ใช้แทน cuid/uuid ทุกที่ในระบบ
//
// ULID ดีกว่า UUID เพราะ:
// 1. Sortable ตาม creation time (มี timestamp prefix)
// 2. URL-safe (ไม่มี special characters)
// 3. Case-insensitive (ใช้ Crockford's Base32)
// 4. 128-bit เหมือน UUID แต่สั้นกว่า (26 chars vs 36 chars)
// ────────────────────────────────────────

/**
 * สร้าง ULID ใหม่
 * @returns string ความยาว 26 ตัวอักษร เช่น "01ARZ3NDEKTSV4RRFFQ69G5FAV"
 */
export function GenerateId(): string {
  return ulid()
}

/**
 * สร้าง ULID ด้วย timestamp ที่กำหนด
 * ใช้สำหรับกรณีต้องการควบคุม timestamp เช่น migration
 */
export function GenerateIdWithTime(timestamp: number): string {
  return ulid(timestamp)
}

/**
 * ดึง timestamp (milliseconds) จาก ULID
 * ใช้สำหรับอ่านเวลาที่สร้าง record โดยไม่ต้อง query createdAt
 */
export function ExtractTimestamp(id: string): number {
  // ULID 10 ตัวแรกคือ encoded timestamp (Crockford's Base32)
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  const time_part = id.substring(0, 10).toUpperCase()
  let timestamp = 0

  for (const char of time_part) {
    timestamp = timestamp * 32 + ENCODING.indexOf(char)
  }

  return timestamp
}
