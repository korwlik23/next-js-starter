import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import type { CreateRoleInput, UpdateRoleInput } from './schema'

// ─────────────────────────────────────────
// SELECT SHAPE
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// LIST ROLES (กรองตาม tenantId)
// ─────────────────────────────────────────
export async function getRolesService(tenant_id: string | null) {
  const roles = await prisma.role.findMany({
    // โชว์ทั้ง System Roles (tenantId = null) และ Roles เฉพาะ Tenant นี้
    where: {
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
    select: roleSelect,
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  })
  // แปลง relation ให้เป็น flat array ของ permission
  return roles.map(FormatRole)
}

// ─────────────────────────────────────────
// GET ROLE BY ID
// ─────────────────────────────────────────
export async function getRoleByIdService(role_id: string, tenant_id: string | null) {
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
    select: roleSelect,
  })
  if (!role) return null
  return FormatRole(role)
}

// ─────────────────────────────────────────
// CREATE ROLE
// ─────────────────────────────────────────
export async function createRoleService(input: CreateRoleInput, tenant_id: string | null) {
  // ตรวจสอบว่าชื่อ Role ซ้ำกันใน Tenant นี้หรือไม่
  const existing = await prisma.role.findFirst({
    where: { name: input.name, tenantId: tenant_id ?? null },
  })
  if (existing) throw new Error(`Role "${input.name}" มีอยู่แล้วใน Tenant นี้`)

  // สร้าง Role พร้อมผูก Permissions
  const role = await prisma.role.create({
    data: {
      id: GenerateId(),
      name: input.name,
      description: input.description,
      tenantId: tenant_id ?? null,
      isSystem: false, // Role ที่ผู้ใช้สร้างเองจะไม่ใช่ System Role
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

  return FormatRole(role)
}

// ─────────────────────────────────────────
// UPDATE ROLE (name, description, sync permissions)
// ─────────────────────────────────────────
export async function updateRoleService(
  role_id: string,
  input: UpdateRoleInput,
  tenant_id: string | null
) {
  // ดึง Role ที่ต้องการแก้ไขพร้อมตรวจสอบสิทธิ์
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
  })
  if (!role) throw new Error('ไม่พบ Role ที่ต้องการแก้ไข')
  // ป้องกันการแก้ไข System Role
  if (role.isSystem) throw new Error('ไม่สามารถแก้ไข System Role ได้')

  // ถ้าส่ง permission_ids มา ให้ sync สิทธิ์ใหม่ (ลบทั้งหมดแล้วสร้างใหม่)
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

  // อัปเดต name/description (ถ้าส่งมา)
  const updated = await prisma.role.update({
    where: { id: role_id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    select: roleSelect,
  })

  return FormatRole(updated)
}

// ─────────────────────────────────────────
// DELETE ROLE
// ─────────────────────────────────────────
export async function deleteRoleService(role_id: string, tenant_id: string | null) {
  const role = await prisma.role.findFirst({
    where: {
      id: role_id,
      OR: [{ tenantId: null }, { tenantId: tenant_id ?? undefined }],
    },
  })
  if (!role) throw new Error('ไม่พบ Role ที่ต้องการลบ')
  // ป้องกันการลบ System Role เช่น owner, admin, member
  if (role.isSystem) throw new Error('ไม่สามารถลบ System Role ได้')

  // Prisma จะลบ RolePermission และ UserRole ที่เกี่ยวข้องโดยอัตโนมัติ (onDelete: Cascade)
  await prisma.role.delete({ where: { id: role_id } })
  return { deleted: true }
}

// ─────────────────────────────────────────
// HELPER: แปลง permission relation เป็น flat array
// ─────────────────────────────────────────
function FormatRole(role: typeof roleSelect extends object ? any : never) {
  return {
    ...role,
    permissions: role.permissions.map((rp: any) => rp.permission),
  }
}
