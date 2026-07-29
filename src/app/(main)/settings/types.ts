export type ProfileFormValues = {
  name: string
  email: string
}

export type PasswordFormValues = {
  currentPassword: string
  password: string
  confirmPassword: string
}

/** ข้อมูลบัญชีที่อ่านสดจาก /api/auth/me ไม่ใช่จาก token */
export type AuthDetails = {
  id: string
  name: string
  email: string
  roles: string[]
  permissions?: string[]
  emailVerifiedAt: string | null
  mfaEnabled: boolean
}

export type MfaSetupState = {
  secret: string
  otpauthUrl: string
}

/**
 * ส่วนของผู้ใช้ที่หน้าตั้งค่าต้องใช้
 * ประกาศแบบ structural เพื่อให้รับ AuthUser จาก authStore ได้โดยไม่ต้องผูกกับ store
 */
export type SettingsUser = {
  id: string
  name: string
  email: string
  emailVerifiedAt?: string | null
  mfaEnabled?: boolean
}
