// ค่าคงที่ของ auth module — รวมไว้ที่เดียวเพื่อให้ปรับนโยบายได้โดยไม่ต้องไล่หาในหลายไฟล์

/** ช่วงเวลาที่นับความพยายามล็อกอินที่ล้มเหลวติดกัน */
export const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000

/** ระยะเวลาที่ล็อกบัญชีหลังล้มเหลวครบจำนวน */
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000

/** จำนวนครั้งที่ล้มเหลวได้ก่อนถูกล็อก */
export const MAX_LOGIN_FAILURES = 5

/** อายุของลิงก์ยืนยันอีเมล */
export const EMAIL_VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000

/** อายุของ MFA challenge ระหว่างรอผู้ใช้กรอกรหัส */
export const MFA_CHALLENGE_EXPIRES_MS = 5 * 60 * 1000

/** อายุของ refresh token */
export const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000
