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

async function getAssignableRoleIds(roleIds: string[] = [], tenantId: string | null | undefined) {
  const uniqueRoleIds = [...new Set(roleIds)]
  if (uniqueRoleIds.length === 0) return []

  const roles = await prisma.role.findMany({
    where: {
      id: { in: uniqueRoleIds },
      OR: tenantId
        ? [{ tenantId }, { tenantId: null, isSystem: true, name: 'member' }]
        : [{ tenantId: null }],
    },
    select: { id: true },
  })

  if (roles.length !== uniqueRoleIds.length) {
    throw new Error('INVALID_ROLE_ASSIGNMENT')
  }

  return roles.map((role) => role.id)
}

export async function getUsersService(tenantId: string | null, params: PaginationParams = {}) {
  const page = params.page ?? paginationConfig.defaultPage
  const limit = Math.min(params.limit ?? paginationConfig.defaultLimit, paginationConfig.maxLimit)
  const skip = (page - 1) * limit

  const where = {
    tenantId,
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

export async function getUserByIdService(id: string, tenantId: string | null = null) {
  return prisma.user.findUnique({
    where: {
      id,
      tenantId: tenantId ?? undefined,
      deletedAt: null,
    },
    select: userSelect,
  })
}

export async function createUserService(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_EXISTS')

  const hashed = await bcrypt.hash(input.password, 12)
  const assignableRoleIds = await getAssignableRoleIds(input.roleIds, input.tenantId)

  return prisma.user.create({
    data: {
      id: GenerateId(),
      name: input.name,
      email: input.email,
      password: hashed,
      tenantId: input.tenantId,
      ...(assignableRoleIds.length
        ? {
            roles: {
              create: assignableRoleIds.map((roleId) => ({ roleId, tenantId: input.tenantId })),
            },
          }
        : {}),
    },
    select: userSelect,
  })
}

export async function updateUserService(
  id: string,
  input: UpdateUserInput,
  tenantId: string | null = null
) {
  const { roleIds, ...userData } = input
  const assignableRoleIds = roleIds ? await getAssignableRoleIds(roleIds, tenantId) : null

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id, deletedAt: null },
      data: userData,
    })

    if (assignableRoleIds) {
      await tx.userRole.deleteMany({
        where: {
          userId: id,
          ...(tenantId ? { tenantId } : {}),
        },
      })

      if (assignableRoleIds.length > 0) {
        await tx.userRole.createMany({
          data: assignableRoleIds.map((roleId) => ({ userId: id, roleId, tenantId })),
          skipDuplicates: true,
        })
      }
    }

    return tx.user.findUniqueOrThrow({
      where: { id },
      select: userSelect,
    })
  })
}

export async function updatePasswordService(id: string, input: UpdatePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error('USER_NOT_FOUND')

  const match = await bcrypt.compare(input.currentPassword, user.password)
  if (!match) throw new Error('CURRENT_PASSWORD_INVALID')

  const hashed = await bcrypt.hash(input.newPassword, 12)
  await prisma.user.update({ where: { id }, data: { password: hashed } })
}

export async function deleteUserService(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })
}
