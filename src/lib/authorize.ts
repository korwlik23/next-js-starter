import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

/**
 * ฟังก์ชันสำหรับการตรวจสอบ Authorization ระดับ API หรือ Server Component
 * ใช้อ่าน Header ที่ถูกส่งต่อมาจาก proxy.ts (x-user-id)
 */
export async function authorize(requiredPermission?: string | string[], requiredRole?: string) {
  const cookieUser = await getAuthUser()
  const userId = cookieUser?.sub

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Always resolve the current user from the database so tenant scope,
  // active status, roles, and permissions cannot be forged from headers.
  const userDetails = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      isActive: true,
      deletedAt: true,
      permissions: { include: { permission: true } },
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  })

  if (!userDetails || !userDetails.isActive || userDetails.deletedAt) {
    throw new Error('Unauthorized')
  }

  const roles = userDetails.roles.map((rolePvt) => rolePvt.role.name)
  const allPermissions = userDetails.permissions.map((p) => p.permission.name)
  userDetails.roles.forEach((rolePvt) => {
    rolePvt.role.permissions.forEach((rp) => {
      if (!allPermissions.includes(rp.permission.name)) {
        allPermissions.push(rp.permission.name)
      }
    })
  })
  const tenantId = userDetails.tenantId ?? null

  // ถ้าไม่มีการระบุสิทธิ์ที่อ้างอิง แค่ต้องการบอกว่าต้องล็อกอิน ถือว่าผ่าน
  if (!requiredPermission && !requiredRole) {
    return { userId, tenantId, roles, permissions: allPermissions, granted: true }
  }

  let granted = false

  const hasPermission = (perm: string) => {
    if (allPermissions.includes('*')) return true
    const [module] = perm.split('.')
    if (allPermissions.includes(`${module}.*`)) return true
    return allPermissions.includes(perm)
  }
  const hasAnyPermission = (permissions: string | string[]) =>
    Array.isArray(permissions) ? permissions.some(hasPermission) : hasPermission(permissions)

  if (requiredPermission && requiredRole) {
    granted = hasAnyPermission(requiredPermission) && roles.includes(requiredRole)
  } else if (requiredPermission) {
    granted = hasAnyPermission(requiredPermission)
  } else if (requiredRole) {
    granted = roles.includes(requiredRole)
  }

  if (!granted) {
    throw new Error('Forbidden')
  }

  return { userId, tenantId, roles, permissions: allPermissions, granted }
}

/**
 * Wrapper สำหรับป้องกัน API Routes (Next.js App Router)
 * @example
 * export const GET = withAuth(async (req, { params, user }) => { ... }, { permission: 'user.read' })
 */
export function withAuth(
  handler: (req: Request, ctx: any) => Promise<NextResponse>,
  options?: { permission?: string | string[]; role?: string }
) {
  return async (req: Request, ctx: any = {}) => {
    try {
      const auth = await authorize(options?.permission, options?.role)
      ctx.user = auth
      return await handler(req, ctx)
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }
  }
}
