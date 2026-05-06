import { z } from 'zod'

interface AuthValidationMessages {
  invalidEmail: string
  nameMin: string
  passwordMin6: string
  passwordMin8: string
  passwordMismatch: string
  tokenRequired: string
  refreshTokenRequired: string
}

const defaultValidationMessages: AuthValidationMessages = {
  invalidEmail: 'Invalid email address',
  nameMin: 'Name must be at least 2 characters',
  passwordMin6: 'Password must be at least 6 characters',
  passwordMin8: 'Password must be at least 8 characters',
  passwordMismatch: 'Passwords do not match',
  tokenRequired: 'Token is required',
  refreshTokenRequired: 'Refresh token is required',
}

export function createLoginSchema(messages: AuthValidationMessages = defaultValidationMessages) {
  return z.object({
    email: z.string().email(messages.invalidEmail),
    password: z.string().min(6, messages.passwordMin6),
  })
}

export function createRegisterSchema(messages: AuthValidationMessages = defaultValidationMessages) {
  return z
    .object({
      name: z.string().min(2, messages.nameMin).max(100),
      email: z.string().email(messages.invalidEmail),
      password: z.string().min(8, messages.passwordMin8),
      confirmPassword: z.string().min(8, messages.passwordMin8),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    })
}

export function createForgotPasswordSchema(
  messages: Pick<AuthValidationMessages, 'invalidEmail'> = defaultValidationMessages
) {
  return z.object({
    email: z.string().email(messages.invalidEmail),
  })
}

export function createResetPasswordSchema(
  messages: Pick<
    AuthValidationMessages,
    'tokenRequired' | 'passwordMin8' | 'passwordMismatch'
  > = defaultValidationMessages
) {
  return z
    .object({
      token: z.string().min(1, messages.tokenRequired),
      password: z.string().min(8, messages.passwordMin8),
      confirmPassword: z.string().min(8, messages.passwordMin8),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    })
}

export function createRefreshTokenSchema(
  messages: Pick<AuthValidationMessages, 'refreshTokenRequired'> = defaultValidationMessages
) {
  return z.object({
    refreshToken: z.string().min(1, messages.refreshTokenRequired),
  })
}

export const loginSchema = createLoginSchema()
export const registerSchema = createRegisterSchema()
export const forgotPasswordSchema = createForgotPasswordSchema()
export const resetPasswordSchema = createResetPasswordSchema()
export const refreshTokenSchema = createRefreshTokenSchema()

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
