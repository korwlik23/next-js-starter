import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { EmailService } from '@/services/email.service'
import { EMAIL_VERIFICATION_EXPIRES_MS } from './constants'
import { createVerificationToken, hashToken, normalizeEmail } from './tokens'

/**
 * ออก token ยืนยันอีเมลใหม่ และยกเลิกใบเก่าที่ยังไม่ถูกใช้
 * คืนค่า token ดิบให้ผู้เรียกนำไปส่งอีเมล ฐานข้อมูลเก็บเฉพาะ hash
 */
export async function CreateEmailVerificationToken(user: { id: string; email: string }) {
  const token = createVerificationToken()
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS)

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId: user.id,
      consumedAt: null,
    },
  })

  await prisma.emailVerificationToken.create({
    data: {
      id: GenerateId(),
      userId: user.id,
      email: normalizeEmail(user.email),
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  return token
}

/**
 * ยืนยันอีเมลจาก token — ใช้ได้ครั้งเดียวและต้องยังไม่หมดอายุ
 */
export async function VerifyEmailService(token: string) {
  const tokenHash = hashToken(token)
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  })

  if (
    !verificationToken ||
    verificationToken.consumedAt ||
    verificationToken.expiresAt < new Date()
  ) {
    throw new Error('AUTH_EMAIL_VERIFICATION_INVALID')
  }

  const verifiedAt = new Date()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: verifiedAt },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { consumedAt: verifiedAt },
    }),
  ])

  return { success: true, email: verificationToken.email }
}

/**
 * ส่งอีเมลยืนยันใหม่ให้ผู้ใช้ที่ยังไม่ยืนยัน
 */
export async function ResendEmailVerificationService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      deletedAt: true,
      emailVerifiedAt: true,
    },
  })

  if (!user || !user.isActive || user.deletedAt) {
    throw new Error('AUTH_USER_NOT_FOUND')
  }

  if (user.emailVerifiedAt) {
    return { sent: false, alreadyVerified: true }
  }

  const verificationToken = await CreateEmailVerificationToken({ id: user.id, email: user.email })
  await EmailService.SendEmailVerificationEmail(user.email, verificationToken)

  return { sent: true, alreadyVerified: false }
}
