import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ulid } from 'ulid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Permissions
  const permissions = [
    { name: 'user.create', module: 'user', action: 'create', description: 'Create users' },
    { name: 'user.read', module: 'user', action: 'read', description: 'Read users' },
    { name: 'user.update', module: 'user', action: 'update', description: 'Update users' },
    { name: 'user.delete', module: 'user', action: 'delete', description: 'Delete users' },
    { name: 'role.create', module: 'role', action: 'create', description: 'Create roles' },
    { name: 'role.read', module: 'role', action: 'read', description: 'Read roles' },
    { name: 'role.update', module: 'role', action: 'update', description: 'Update roles' },
    { name: 'role.delete', module: 'role', action: 'delete', description: 'Delete roles' },
    { name: 'dashboard.view', module: 'dashboard', action: 'view', description: 'View dashboard' },
    { name: 'settings.view', module: 'settings', action: 'view', description: 'View settings' },
    {
      name: 'settings.update',
      module: 'settings',
      action: 'update',
      description: 'Update settings',
    },
    { name: 'billing.view', module: 'billing', action: 'view', description: 'View billing' },
    { name: 'billing.manage', module: 'billing', action: 'manage', description: 'Manage billing' },
    { name: 'audit.view', module: 'audit', action: 'view', description: 'View audit logs' },
  ]

  const createdPermissions: Record<string, { id: string }> = {}

  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: { id: ulid(), ...perm },
    })
    createdPermissions[perm.name] = p
  }
  console.log(`✅ ${permissions.length} permissions seeded`)

  // ─── Roles (use findFirst + create because tenantId is nullable)
  async function findOrCreateRole(name: string, description: string) {
    const existing = await prisma.role.findFirst({ where: { name, tenantId: null } })
    if (existing) return existing
    return prisma.role.create({ data: { id: ulid(), name, description, isSystem: true } })
  }

  const ownerRole = await findOrCreateRole('owner', 'Full system access')
  const adminRole = await findOrCreateRole('admin', 'Admin access')
  const memberRole = await findOrCreateRole('member', 'Basic access')
  console.log('✅ 3 roles seeded (owner, admin, member)')

  // ─── Role Permissions
  // Owner → all permissions
  for (const perm of Object.values(createdPermissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: perm.id },
    })
  }

  // Admin → limited
  const adminPerms = [
    'user.create',
    'user.read',
    'user.update',
    'role.read',
    'dashboard.view',
    'settings.view',
    'audit.view',
  ]
  for (const permName of adminPerms) {
    const perm = createdPermissions[permName]
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      })
    }
  }

  // Member → basic
  const memberPerms = ['dashboard.view', 'user.read']
  for (const permName of memberPerms) {
    const perm = createdPermissions[permName]
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: memberRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: memberRole.id, permissionId: perm.id },
      })
    }
  }
  console.log('✅ Role permissions assigned')

  // ─── Owner User
  const hashedPassword = await bcrypt.hash('password123', 12)
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@starter.dev' },
    update: {},
    create: {
      id: ulid(),
      name: 'Owner',
      email: 'owner@starter.dev',
      password: hashedPassword,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerUser.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: ownerUser.id, roleId: ownerRole.id },
  })
  console.log('✅ Owner user seeded: owner@starter.dev / password123')

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
