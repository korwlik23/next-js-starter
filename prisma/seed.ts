import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
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
    { name: 'team.invite', module: 'team', action: 'invite', description: 'Invite team members' },
    { name: 'audit.view', module: 'audit', action: 'view', description: 'View audit logs' },
    {
      name: 'translation.manage',
      module: 'translation',
      action: 'manage',
      description: 'Manage translations',
    },
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
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'dashboard.view',
    'settings.view',
    'settings.update',
    'billing.view',
    'billing.manage',
    'team.invite',
    'audit.view',
    'translation.manage',
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

  // ─── Feature Flags (Runtime Toggles)
  const featureFlags = [
    { key: 'multiTenant', enabled: false, description: 'Enable multi-tenant mode' },
    { key: 'registration', enabled: true, description: 'Allow new user registration' },
    { key: 'forgotPassword', enabled: true, description: 'Enable forgot password flow' },
    { key: 'darkMode', enabled: true, description: 'Enable dark mode toggle' },
    { key: 'i18n', enabled: true, description: 'Enable internationalization' },
    { key: 'trialSystem', enabled: true, description: 'Enable trial period for new tenants' },
    { key: 'apiKeys', enabled: true, description: 'Enable API key management' },
    { key: 'analytics', enabled: true, description: 'Enable analytics dashboard' },
    { key: 'auditLog', enabled: true, description: 'Enable audit logging' },
    { key: 'sso', enabled: false, description: 'Enable SSO/OAuth login' },
  ]

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: { id: ulid(), ...flag },
    })
  }
  console.log(`✅ ${featureFlags.length} feature flags seeded`)

  // ─── Translations (Initial Seed)
  const translations = [
    { locale: 'en', namespace: 'common', key: 'welcome', value: 'Welcome' },
    { locale: 'th', namespace: 'common', key: 'welcome', value: 'ยินดีต้อนรับ' },
    { locale: 'en', namespace: 'auth', key: 'login', value: 'Login' },
    { locale: 'th', namespace: 'auth', key: 'login', value: 'เข้าสู่ระบบ' },
  ]

  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        locale_namespace_key: {
          locale: t.locale,
          namespace: t.namespace,
          key: t.key,
        },
      },
      update: {},
      create: { id: ulid(), ...t },
    })
  }
  console.log(`✅ ${translations.length} translations seeded`)

  // ─── Mock Tenants & Tenant Users (SaaS Demo Data)
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { id: ulid(), name: 'Acme Corp', slug: 'acme-corp', plan: 'pro' },
  })

  // Acme Admin User
  const acmeAdminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      id: ulid(),
      name: 'Acme Admin',
      email: 'admin@acme.com',
      password: hashedPassword,
      tenantId: acmeTenant.id,
    },
  })

  // Acme Editor User
  const acmeEditorUser = await prisma.user.upsert({
    where: { email: 'editor@acme.com' },
    update: {},
    create: {
      id: ulid(),
      name: 'Acme Editor',
      email: 'editor@acme.com',
      password: hashedPassword,
      tenantId: acmeTenant.id,
    },
  })

  // Acme Roles (Tenant specific)
  const acmeAdminRole = await prisma.role.upsert({
    where: { name_tenantId: { name: 'admin', tenantId: acmeTenant.id } },
    update: {},
    create: { id: ulid(), name: 'admin', description: 'Acme Admin Role', tenantId: acmeTenant.id },
  })
  const acmeEditorRole = await prisma.role.upsert({
    where: { name_tenantId: { name: 'editor', tenantId: acmeTenant.id } },
    update: {},
    create: {
      id: ulid(),
      name: 'editor',
      description: 'Acme Editor Role',
      tenantId: acmeTenant.id,
    },
  })

  for (const permName of adminPerms) {
    const perm = createdPermissions[permName]
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: acmeAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: acmeAdminRole.id, permissionId: perm.id },
      })
    }
  }

  for (const permName of memberPerms) {
    const perm = createdPermissions[permName]
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: acmeEditorRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: acmeEditorRole.id, permissionId: perm.id },
      })
    }
  }

  // Assign role to user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: acmeAdminUser.id, roleId: acmeAdminRole.id } },
    update: {},
    create: { userId: acmeAdminUser.id, roleId: acmeAdminRole.id, tenantId: acmeTenant.id },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: acmeEditorUser.id, roleId: acmeEditorRole.id } },
    update: {},
    create: { userId: acmeEditorUser.id, roleId: acmeEditorRole.id, tenantId: acmeTenant.id },
  })

  // Assign Mock Subscription for Acme Corp
  await prisma.subscription.upsert({
    where: { tenantId: acmeTenant.id },
    update: {},
    create: {
      id: ulid(),
      tenantId: acmeTenant.id,
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  })

  // Assign Mock API Key
  const mockApiKeyHash = crypto.createHash('sha256').update('nsk_mock_api_key_123').digest('hex')
  await prisma.apiKey.upsert({
    where: { hashedKey: mockApiKeyHash },
    update: {},
    create: {
      id: ulid(),
      tenantId: acmeTenant.id,
      name: 'Production Key',
      hashedKey: mockApiKeyHash,
      prefix: 'nsk_mock_api',
      createdBy: acmeAdminUser.id,
    },
  })
  console.log('✅ Mock Tenant & Users seeded: admin@acme.com / password123')

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
