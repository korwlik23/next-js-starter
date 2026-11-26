import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { EmailService } from '@/services/email.service'
import type { ForgotPasswordInput, ResetPasswordInput } from '../schema'
import { AuthRepository } from '../repository'

/**
 * ขอลิงก์ตั้งรหัสผ่านใหม่
 *
 * คืน success เสมอแม้ไม่พบอีเมล เพื่อไม่ให้ใช้ endpoint นี้ทดสอบว่าอีเมลใดมีในระบบ
 */
export async function ForgotPasswordService(input_data: ForgotPasswordInput) {
  const user = await AuthRepository.findUserByEmail(input_data.email)

  if (!user || !user.isActive || user.deletedAt) return { success: true }

  const token = GenerateId()
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 ชั่วโมง

  // เคลียร์ token เก่าแล้วสร้างใหม่ ให้มีใบที่ใช้ได้ใบเดียวต่อหนึ่งอีเมล
  await prisma.resetPasswordToken.deleteMany({ where: { email: user.email } })
  await prisma.resetPasswordToken.create({
    data: {
      id: GenerateId(),
      email: user.email,
      token,
      expiresAt: expires_at,
    },
  })

  await EmailService.SendPasswordResetEmail(user.email, token)

  logger.info(`Forgot password requested for: ${user.email}`)
  return { success: true }
}

/**
 * ตั้งรหัสผ่านใหม่จาก token ที่ยังไม่หมดอายุ แล้วลบ token ทิ้งทันที
 */
export async function ResetPasswordService(input_data: ResetPasswordInput) {
  const reset_token = await prisma.resetPasswordToken.findUnique({
    where: { token: input_data.token },
  })

  if (!reset_token || reset_token.expiresAt < new Date()) {
    throw new Error('Token ไม่ถูกต้องหรือหมดอายุแล้ว')
  }

  const user = await AuthRepository.findUserByEmail(reset_token.email)
  if (!user) {
    throw new Error('ไม่พบข้อมูลผู้ใช้')
  }

  const hashed_password = await bcrypt.hash(input_data.password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed_password },
  })

  await prisma.resetPasswordToken.deleteMany({ where: { email: user.email } })

  logger.info(`Password successfully reset for: ${user.email}`)
  return { success: true }
}
