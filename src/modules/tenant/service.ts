import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'
import type { CreateTenantInput, UpdateTenantInput } from './schema'
import { ulid } from 'ulid'
import { EmailService } from '@/services/email.service'
import { TenantRepository } from './repository'

// ────────────────────────────────────────
// Tenant Service — CRUD Operations
// Business logic แยกจาก route handler
// ────────────────────────────────────────

/**
 * สร้าง tenant ใหม่
 */
export async function CreateTenantService(input: CreateTenantInput) {
  // ตรวจสอบ slug ซ้ำ
  const existing = await TenantRepository.findBySlug(input.slug)
  if (existing) throw new Error('Slug นี้ถูกใช้งานแล้ว')

  const tenant = await prisma.tenant.create({
    data: {
      id: GenerateId(),
      name: input.name,
      slug: input.slug,
      plan: input.plan,
    },
  })

  logger.info(`Tenant created: ${tenant.name} (${tenant.slug})`)
  return tenant
}

/**
 * ดึง tenant ตาม ID
 */
export async function GetTenantByIdService(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
  })
  if (!tenant) throw new Error('ไม่พบ Tenant')
  return tenant
}

/**
 * ดึงรายการ tenants พร้อม pagination
 */
export async function ListTenantsService(params: {
  page?: number
  limit?: number
  search?: string
}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const skip = (page - 1) * limit

  const where = {
    deletedAt: null,
    ...(params.search
      ? {
          OR: [{ name: { contains: params.search } }, { slug: { contains: params.search } }],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.tenant.count({ where }),
  ])

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * อัปเดต tenant
 */
export async function UpdateTenantService(id: string, input: UpdateTenantInput) {
  // ตรวจสอบ slug ซ้ำ (ถ้ามีการเปลี่ยน)
  if (input.slug) {
    const existing = await prisma.tenant.findFirst({
      where: { slug: input.slug, id: { not: id } },
    })
    if (existing) throw new Error('Slug นี้ถูกใช้งานแล้ว')
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: input,
  })

  logger.info(`Tenant updated: ${tenant.id}`)
  return tenant
}

/**
 * ลบ tenant (soft delete)
 */
export async function DeleteTenantService(id: string) {
  await prisma.tenant.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  logger.info(`Tenant soft-deleted: ${id}`)
}

export async function GetMembersAndInvitationsService(tenantId: string) {
  // 1. ดึงข้อมูลสมาชิก (Users ที่มี role ใน tenant นี้)
  const members = await prisma.userRole.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      },
      role: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 2. ดึงข้อมูลการเชิญที่ยังค้างอยู่
  const invitations = await prisma.invitation.findMany({
    where: { tenantId, status: 'pending', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  return {
    members: members.map((m) => ({ ...m.user, role: m.role.name })),
    invitations,
  }
}

export async function InviteUserService(
  inviterId: string,
  email: string,
  roleId: string,
  tenantId: string
) {
  const inviter = await prisma.user.findUnique({
    where: { id: inviterId },
  })
  if (!inviter?.tenantId || inviter.tenantId !== tenantId) throw new Error('Forbidden')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

  const role = await prisma.role.findFirst({
    where: {
      AND: [{ OR: [{ id: roleId }, { name: roleId }] }, { OR: [{ tenantId }, { tenantId: null }] }],
    },
    select: { id: true },
  })
  if (!role) throw new Error('Invalid role for this tenant')

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser && existingUser.tenantId === tenantId) {
    throw new Error('User is already in this team')
  }

  const token = ulid()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await prisma.invitation.create({
    data: { id: ulid(), email, tenantId, roleId: role.id, token, expiresAt },
  })

  await EmailService.SendTeamInviteEmail(email, inviter.name, tenant?.name || 'Your Team', token)
  return invite
}
