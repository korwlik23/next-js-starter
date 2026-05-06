import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import type { CreateRoleInput, UpdateRoleInput } from './schema'

const roleSelect = {
  id: true,
  name: true,
  description: true,
  tenantId: true,
  isSystem: true,
  createdAt: true,
  permissions: {
    select: {
      permission: {
        select: { id: true, name: true, module: true, action: true, description: true },
      },
    },
  },
}

export async function getRolesService(tenant_id: string | null) {
  const roles = await prisma.role.findMany({
    where: {
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
    select: roleSelect,
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  })

  return roles.map(formatRole)
}

export async function getRoleByIdService(role_id: string, tenant_id: string | null) {
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
    select: roleSelect,
  })
  if (!role) return null
  return formatRole(role)
}

export async function createRoleService(input: CreateRoleInput, tenant_id: string | null) {
  const existing = await prisma.role.findFirst({
    where: { name: input.name, tenantId: tenant_id ?? null },
  })
  if (existing) throw new Error('ROLE_EXISTS')

  const role = await prisma.role.create({
    data: {
      id: GenerateId(),
      name: input.name,
      description: input.description,
      tenantId: tenant_id ?? null,
      isSystem: false,
      ...(input.permission_ids.length > 0
        ? {
            permissions: {
              create: input.permission_ids.map((permission_id) => ({
                permission: { connect: { id: permission_id } },
              })),
            },
          }
        : {}),
    },
    select: roleSelect,
  })

  return formatRole(role)
}

export async function updateRoleService(
  role_id: string,
  input: UpdateRoleInput,
  tenant_id: string | null
) {
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
  })
  if (!role) throw new Error('ROLE_NOT_FOUND')
  if (role.isSystem) throw new Error('SYSTEM_ROLE_UPDATE_FORBIDDEN')

  if (input.permission_ids !== undefined) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role_id } })

    if (input.permission_ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: input.permission_ids.map((permission_id) => ({
          roleId: role_id,
          permissionId: permission_id,
        })),
        skipDuplicates: true,
      })
    }
  }

  const updated = await prisma.role.update({
    where: { id: role_id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    select: roleSelect,
  })

  return formatRole(updated)
}

export async function deleteRoleService(role_id: string, tenant_id: string | null) {
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
  })
  if (!role) throw new Error('ROLE_NOT_FOUND')
  if (role.isSystem) throw new Error('SYSTEM_ROLE_DELETE_FORBIDDEN')

  await prisma.role.delete({ where: { id: role_id } })
  return { deleted: true }
}

function formatRole(role: typeof roleSelect extends object ? any : never) {
  return {
    ...role,
    permissions: role.permissions.map((rp: any) => rp.permission),
  }
}
