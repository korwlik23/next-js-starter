import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signAuthTokens } from '@/lib/jwt'
import { logger } from '@/lib/logger'
import { inngest } from '@/lib/inngest'
import { GenerateId } from '@/lib/ulid'
import { EmailService } from '@/services/email.service'
import type { RegisterInput } from '../schema'
import type { AuthTokens, TokenPayload } from '@/types'
import { AuthRepository } from '../repository'
import { CreateEmailVerificationToken } from './email-verification'
import {
  BuildTokenPayload,
  createSessionId,
  GetUserWithPermissions,
  issueRefreshToken,
} from './principal'
import { normalizeEmail } from './tokens'

/**
 * สมัครสมาชิกใหม่ พร้อมผูก role `member` เริ่มต้นถ้ามีในระบบ
 *
 * การส่งอีเมลยืนยันและการ enqueue งานเบื้องหลังถูกดักไว้ไม่ให้ทำให้การสมัครล้มเหลว
 * เพราะผู้ใช้ถูกสร้างไปแล้วและขอส่งอีเมลใหม่ได้ภายหลัง
 */
export async function RegisterService(
  input_data: RegisterInput
): Promise<{ tokens: AuthTokens; user: TokenPayload }> {
  const email = normalizeEmail(input_data.email)
  const existing = await AuthRepository.findUserByEmail(email)
  if (existing) throw new Error('AUTH_EMAIL_IN_USE')

  const hashed_password = await bcrypt.hash(input_data.password, 12)

  const member_role = await prisma.role.findFirst({
    where: { name: 'member', tenantId: null },
  })

  const user = await prisma.user.create({
    data: {
      id: GenerateId(),
      name: input_data.name,
      email,
      password: hashed_password,
      ...(member_role ? { roles: { create: { roleId: member_role.id } } } : {}),
    },
  })

  const verificationToken = await CreateEmailVerificationToken({ id: user.id, email: user.email })
  await EmailService.SendEmailVerificationEmail(user.email, verificationToken).catch((error) => {
    logger.warn('Failed to send email verification email', { error, userId: user.id })
  })

  const user_with_perms = await GetUserWithPermissions(user.id)
  const sessionId = createSessionId()
  const payload = { ...BuildTokenPayload(user_with_perms), sid: sessionId }
  const tokens = await signAuthTokens(payload)

  await issueRefreshToken(user.id, tokens.refreshToken, sessionId)

  await inngest
    .send({
      name: 'app/user.registered',
      data: {
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
      },
    })
    .catch((error) => {
      const missing_event_key =
        error instanceof Error && error.message.includes("couldn't find an event key")

      if (missing_event_key && process.env.NODE_ENV !== 'production') {
        logger.debug('Skipped user registration event; INNGEST_EVENT_KEY is not configured')
        return
      }

      logger.warn('Failed to enqueue user registration event', error)
    })

  logger.info(`New user registered: ${user.email}`)
  return { tokens, user: payload }
}
