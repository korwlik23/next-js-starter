import { api } from '@/services/apiClient'
import type { AuthDetails, MfaSetupState } from './types'

// รวม endpoint ที่หน้าตั้งค่าเรียก ไว้ที่เดียว

export function fetchAuthDetailsRequest() {
  return api.get<AuthDetails>('/api/auth/me')
}

export function updateProfileRequest(userId: string, input: { name: string; email: string }) {
  return api.patch(`/api/user/${userId}`, input)
}

export function changePasswordRequest(
  userId: string,
  input: { currentPassword: string; newPassword: string; confirmPassword: string }
) {
  return api.patch(`/api/user/${userId}`, input)
}

export function resendVerificationRequest() {
  return api.post<{ sent: boolean; alreadyVerified: boolean }>('/api/auth/verify-email/resend', {})
}

export function startMfaSetupRequest() {
  return api.post<MfaSetupState>('/api/auth/mfa/setup', {})
}

export function confirmMfaSetupRequest(code: string) {
  return api.post<{ enabled: boolean; recoveryCodes: string[] }>('/api/auth/mfa/confirm', { code })
}

export function disableMfaRequest(code: string) {
  return api.post<{ enabled: boolean }>('/api/auth/mfa/disable', { code })
}
