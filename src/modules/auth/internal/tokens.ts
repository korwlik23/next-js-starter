import { createHash } from 'crypto'
import { GenerateId } from '@/lib/ulid'

/** ทำให้อีเมลอยู่ในรูปแบบเดียวเสมอ ก่อนค้นหาหรือบันทึก */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/** เก็บเฉพาะ hash ของ token ลงฐานข้อมูล ไม่เก็บค่าดิบ */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** token สำหรับลิงก์ยืนยันอีเมล */
export function createVerificationToken() {
  return `${GenerateId()}${GenerateId()}`
}
