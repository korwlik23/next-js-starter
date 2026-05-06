export const features = {
  multiTenant: true, // เปิดใช้งานตามแผน Phase 1.3
  registration: true,
  forgotPassword: true,
  darkMode: true,
  i18n: true,
  devTools: process.env.NODE_ENV === 'development',
  trialSystem: true,
  apiKeys: true,
  analytics: true,
  auditLog: true,
  sso: false,
} as const
