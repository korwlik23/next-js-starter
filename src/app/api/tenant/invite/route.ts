import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ulid } from 'ulid'
import { Resend } from 'resend'
import { withAuth } from '@/lib/authorize'

const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
  tenantId: z.string().min(1),
})

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }

  return new Resend(apiKey)
}

export const POST = withAuth(
  async (req: Request, { user }: any) => {
    try {
      const body = await req.json()
      const { email, roleId, tenantId } = inviteSchema.parse(body)

      const inviter = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      })
      if (!inviter?.tenantId || inviter.tenantId !== tenantId) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
      }

      const role = await prisma.role.findFirst({
        where: {
          AND: [
            { OR: [{ id: roleId }, { name: roleId }] },
            { OR: [{ tenantId }, { tenantId: null }] },
          ],
        },
        select: { id: true },
      })
      if (!role) {
        return NextResponse.json(
          { success: false, message: 'Invalid role for this tenant' },
          { status: 400 }
        )
      }

      // เช็คว่าเคยชวนหรืออยู่ใน tenant เดี่ยวกันแล้วหรือไม่
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser && existingUser.tenantId === tenantId) {
        return NextResponse.json(
          { success: false, message: 'User is already in this team' },
          { status: 400 }
        )
      }

      const token = ulid()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // หมดอายุใน 7 วัน

      const invite = await prisma.invitation.create({
        data: {
          id: ulid(),
          email,
          tenantId,
          roleId: role.id,
          token,
          expiresAt,
        },
      })

      // Send Email via Resend
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`

      const resend = getResendClient()
      if (resend) {
        await resend.emails.send({
          from: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@yourdomain.com',
          to: email,
          subject: 'You have been invited to join the team!',
          html: `<p>Hello!</p><p>You have been invited to join a team. Click <a href="${inviteUrl}">here</a> to accept the invitation.</p>`,
        })
      }

      return NextResponse.json({ success: true, data: invite, message: 'Invitation sent' })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, message: 'Invalid data', errors: (error as any).errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, message: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { permission: 'team.invite' }
)
