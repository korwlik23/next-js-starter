// ─────────────────────────────────────────
// AUTH SERVICE — public entrypoint
// ─────────────────────────────────────────
// ไฟล์นี้เคยรวมทุกอย่างไว้ที่เดียว 657 บรรทัด ครอบ 6 เรื่องที่ deploy แยกกันได้
// (ยืนยันอีเมล, MFA, session/token, สมัครสมาชิก, ตั้งรหัสผ่านใหม่, โหลด principal)
// จึงถูกแยกเป็นไฟล์ตามขอบเขตใน ./internal และเหลือไฟล์นี้เป็นจุดเข้าที่คงที่
// เพื่อไม่ให้ผู้เรียกเดิมต้องแก้ import
//
// เพิ่มความสามารถใหม่ให้ไปที่ไฟล์ใน ./internal ไม่ใช่ที่นี่

export {
  CreateEmailVerificationToken,
  ResendEmailVerificationService,
  VerifyEmailService,
} from './internal/email-verification'

export {
  ConfirmMfaSetupService,
  DisableMfaService,
  StartMfaSetupService,
  VerifyMfaChallengeService,
} from './internal/mfa'

export { BuildTokenPayload, GetUserWithPermissions } from './internal/principal'

export { LoginService, LogoutService, RefreshTokenService } from './internal/session'

export { RegisterService } from './internal/registration'

export { ForgotPasswordService, ResetPasswordService } from './internal/password-reset'

export type { LoginContext, LoginServiceResult } from './internal/types'

// Backward-compatible aliases used by route handlers.
export {
  ConfirmMfaSetupService as confirmMfaSetupService,
  DisableMfaService as disableMfaService,
  StartMfaSetupService as startMfaSetupService,
  VerifyMfaChallengeService as verifyMfaChallengeService,
} from './internal/mfa'

export {
  ResendEmailVerificationService as resendEmailVerificationService,
  VerifyEmailService as verifyEmailService,
} from './internal/email-verification'

export {
  LoginService as loginService,
  LogoutService as logoutService,
  RefreshTokenService as refreshTokenService,
} from './internal/session'

export { RegisterService as registerService } from './internal/registration'

export {
  ForgotPasswordService as forgotPasswordService,
  ResetPasswordService as resetPasswordService,
} from './internal/password-reset'
