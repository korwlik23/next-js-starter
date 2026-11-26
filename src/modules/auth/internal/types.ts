import type { AuthTokens, TokenPayload } from '@/types'

/** ข้อมูลผู้เรียกที่ใช้ประกอบการบันทึกและออก MFA challenge */
export interface LoginContext {
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * ผลของการล็อกอิน — สำเร็จได้ token ทันที หรือถูกส่งต่อไปยังขั้น MFA
 */
export type LoginServiceResult =
  | { tokens: AuthTokens; user: TokenPayload; mfaRequired?: false }
  | { mfaRequired: true; challengeId: string; expiresAt: string }
