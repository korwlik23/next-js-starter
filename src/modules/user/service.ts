import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import type { CreateUserInput, UpdateUserInput, UpdatePasswordInput } from './schema'
import type { PaginationParams } from '@/types'
import { paginationConfig } from '@/config'

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  tenantId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: { select: { id: true, name: true } },
    },
  },
}

// ─────────────────────────────────────────
// GET USERS (paginated)
// ─────────────────────────────────────────
export async function getUsersService(tenantId: string | null, params: PaginationParams = {}) {
  const page = params.page ?? paginationConfig.defaultPage
  const limit = Math.min(params.limit ?? paginationConfig.defaultLimit, paginationConfig.maxLimit)
  const skip = (page - 1) * limit

  const where = {
    tenantId, // บังคับกรองตาม tenantId
    deletedAt: null,
    ...(params.search
      ? {
          OR: [{ name: { contains: params.search } }, { email: { contains: params.search } }],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip,
      take: limit,
      orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total, page, limit }
}

// ─────────────────────────────────────────
// GET USER BY ID
// ─────────────────────────────────────────
export async function getUserByIdService(id: string, tenantId: string | null = null) {
  return prisma.user.findUnique({
    where: {
      id,
      tenantId: tenantId ?? undefined, // ถ้าส่ง tenantId มาให้กรองด้วย
      deletedAt: null,
    },
    select: userSelect,
  })
}

// ─────────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────────
export async function createUserService(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('อีเมลนี้ถูกใช้งานแล้ว')

  const hashed = await bcrypt.hash(input.password, 12)

  return prisma.user.create({
    data: {
      id: GenerateId(),
      name: input.name,
      email: input.email,
      password: hashed,
      tenantId: input.tenantId,
      ...(input.roleIds?.length
        ? {
            roles: {
              create: input.roleIds.map((roleId) => ({ roleId })),
            },
          }
        : {}),
    },
    select: userSelect,
  })
}

// ─────────────────────────────────────────
// UPDATE USER
// ─────────────────────────────────────────
export async function updateUserService(id: string, input: UpdateUserInput) {
  return prisma.user.update({
    where: { id, deletedAt: null },
    data: input,
    select: userSelect,
  })
}

// ─────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────
export async function updatePasswordService(id: string, input: UpdatePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error('ไม่พบผู้ใช้งาน')

  const match = await bcrypt.compare(input.currentPassword, user.password)
  if (!match) throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง')

  const hashed = await bcrypt.hash(input.newPassword, 12)
  await prisma.user.update({ where: { id }, data: { password: hashed } })
}

// ─────────────────────────────────────────
// SOFT DELETE
// ─────────────────────────────────────────
export async function deleteUserService(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}
