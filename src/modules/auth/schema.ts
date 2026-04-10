import { z } from 'zod'

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร').max(100),
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
