import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

/**
 * ฟังก์ชันสำหรับการตรวจสอบ Authorization ระดับ API หรือ Server Component
 * ใช้อ่าน Header ที่ถูกส่งต่อมาจาก proxy.ts (x-user-id)
 */
export async function authorize(requiredPermission?: string | string[], requiredRole?: string) {
  const headersList = await headers()
  let userId = headersList.get('x-user-id')
  const userRolesStr = headersList.get('x-user-roles')
  const cookieUser = userId ? null : await getAuthUser()

  if (!userId && cookieUser) {
    userId = cookieUser.sub
  }

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const roles: string[] = userRolesStr ? JSON.parse(userRolesStr) : (cookieUser?.roles ?? [])

  // ถ้าไม่มีการระบุสิทธิ์ที่อ้างอิง แค่ต้องการบอกว่าต้องล็อกอิน ถือว่าผ่าน
  if (!requiredPermission && !requiredRole) {
    return { userId, roles, granted: true }
  }

  // ดึง Permission จากฐานข้อมูลเพื่อเช็คจริง (ถ้าต้องการดึงแบบ Realtime)
  const userDetails = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: { include: { permission: true } },
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  })

  if (!userDetails) {
    throw new Error('User not found')
  }

  const allPermissions = userDetails.permissions.map((p) => p.permission.name)
  userDetails.roles.forEach((rolePvt) => {
    rolePvt.role.permissions.forEach((rp) => {
      if (!allPermissions.includes(rp.permission.name)) {
        allPermissions.push(rp.permission.name)
      }
    })
  })

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

  return { userId, roles, granted }
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
