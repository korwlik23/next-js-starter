import { NextRequest } from 'next/server'
import { successResponse, badRequest, serverError, unauthorized } from '@/utils/api'
import { getAuthUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { EmailService } from '@/services/email.service'
import { CreateAuditLog } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

// ─────────────────────────────────────────
// TEAM INVITATION API
// ─────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  roleId: z.string().min(1, 'ต้องระบุ Role ID'),
  tenantId: z.string().min(1, 'ต้องระบุ Tenant ID'),
})

/**
 * POST /api/tenant/invite — เชิญสมาชิก (Invite User)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) return unauthorized()

    // 1. ตรวจสอบสิทธิ์ (จำลองใช้ tenant.invite หรืออาจเป็น wildcard ของ admin)
    if (!can(user, 'user.create')) {
      return badRequest('ไม่มีสิทธิ์ในการเชิญผู้ใช้')
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Validation error', {
        validation: parsed.error.issues.map((i) => i.message),
      })
    }

    const { email, roleId, tenantId } = parsed.data

    // 2. ตรวจสอบว่ามีผู้ใช้นี้ใน tenant นั้นแล้วหรือยัง? (ถ้าเป็นแอพจริงอาจต้องเช็คใน `user_roles`)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    })

    if (existingUser) {
      const isAlreadyInTenant = existingUser.roles.some((r) => r.tenantId === tenantId)
      if (isAlreadyInTenant) {
        return badRequest('ผู้ใช้นี้อยู่ใน Team แล้ว')
      }
    }

    // 3. TODO: เช็ค Quota ของระบบบิลลิ่ง (Usage Limit Check)
    // const sub = await prisma.subscription.findUnique({ where: { tenantId } })
    // if(sub && sub.plan === 'free') {
    //    // check max users
    // }

    // 4. สร้าง Invitation token
    const token = GenerateId() // ใช้ ULID เป็น token ให้เดายาก แต่ถ้าให้ดีขึ้นควร hash แบบหลวมๆ
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // หมดอายุใน 7 วัน

    const invitation = await prisma.invitation.create({
      data: {
        id: GenerateId(),
        email,
        tenantId,
        roleId,
        token,
        status: 'pending',
        expiresAt,
      },
    })

    // 5. ดึงชื่อ Tenant ไปใส่ในอีเมล
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    // 6. ส่งอีเมลเชิญ (ไปที่ Placeholder)
    await EmailService.SendTeamInviteEmail(email, user.name ?? 'Team Member', tenant?.name || 'Your Team', token)

    // 7. เก็บ Audit Log
    await CreateAuditLog({
      action: 'TEAM_INVITE_SENT',
      userId: user.sub,
      tenantId: tenantId,
      entity: 'Invitation',
      entityId: invitation.id,
      metadata: { targetEmail: email },
    })

    return successResponse({ invitationId: invitation.id }, 'ส่งคำเชิญเรียบร้อยแล้ว')
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Internal error')
  }
}
