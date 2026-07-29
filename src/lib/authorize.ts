import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { runWithTenantContext } from '@/lib/tenant-context'
import { getAuthorizationCache, runWithAuthorizationCache } from '@/lib/authorization-cache'

export type AuthorizedPrincipal = {
  userId: string
  tenantId: string | null
  roles: string[]
  permissions: string[]
  granted: boolean
}

/**
 * โหลด principal ปัจจุบันจาก database
 *
 * สิทธิ์มาจาก role เท่านั้น — direct user grant (`user_permissions`) ถูกเลิกใช้
 * โดยเจตนา เพราะทำให้ effective permission มาจากสองทาง ทำให้ตอบไม่ได้ว่า
 * "ถอด role นี้แล้วสิทธิ์หายจริงไหม" และ audit ยาก
 * หากต้องการสิทธิ์เฉพาะบุคคล ให้สร้าง role เฉพาะแล้ว assign แทน
 */
async function loadPrincipal(userId: string): Promise<Omit<AuthorizedPrincipal, 'granted'>> {
  const userDetails = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      isActive: true,
      deletedAt: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  })

  if (!userDetails || !userDetails.isActive || userDetails.deletedAt) {
    throw new Error('Unauthorized')
  }

  const roles = userDetails.roles.map((rolePvt) => rolePvt.role.name)

  const permissions = [
    ...new Set(
      userDetails.roles.flatMap((rolePvt) =>
        rolePvt.role.permissions.map((rp) => rp.permission.name)
      )
    ),
  ]

  return { userId, tenantId: userDetails.tenantId ?? null, roles, permissions }
}

/**
 * ฟังก์ชันสำหรับการตรวจสอบ Authorization ระดับ API หรือ Server Component
 *
 * principal ถูก resolve จาก database เสมอ เพื่อไม่ให้ tenant scope, สถานะ active,
 * role และ permission ถูกปลอมผ่าน header หรือเนื้อใน token
 *
 * ผลลัพธ์ถูก cache ไว้ต่อหนึ่ง request เท่านั้น (ดู @/lib/authorization-cache)
 * จึงไม่มีปัญหาสิทธิ์ค้างข้าม request
 */
export async function authorize(
  requiredPermission?: string | string[],
  requiredRole?: string
): Promise<AuthorizedPrincipal> {
  const cookieUser = await getAuthUser()
  const userId = cookieUser?.sub

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const cache = getAuthorizationCache()
  let principal = cache?.get(userId)

  if (!principal) {
    principal = await loadPrincipal(userId)
    cache?.set(userId, principal)
  }

  const { tenantId, roles, permissions } = principal

  // ถ้าไม่มีการระบุสิทธิ์ที่อ้างอิง แค่ต้องการบอกว่าต้องล็อกอิน ถือว่าผ่าน
  if (!requiredPermission && !requiredRole) {
    return { userId, tenantId, roles, permissions, granted: true }
  }

  // เทียบตรงตัวเท่านั้น ไม่รองรับ wildcard — ดูเหตุผลใน @/lib/permissions
  const hasPermission = (perm: string) => permissions.includes(perm)
  const hasAnyPermission = (required: string | string[]) =>
    Array.isArray(required) ? required.some(hasPermission) : hasPermission(required)

  let granted = false

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

  return { userId, tenantId, roles, permissions, granted }
}

/**
 * Wrapper สำหรับป้องกัน API Routes (Next.js App Router)
 *
 * @example
 * export const GET = withAuth(async (req, { user }) => { ... }, { permission: 'user.read' })
 */
export function withAuth(
  handler: (req: Request, ctx: any) => Promise<NextResponse>,
  options?: { permission?: string | string[]; role?: string }
) {
  return async (req: Request, ctx: any = {}) => {
    try {
      return await runWithAuthorizationCache(async () => {
        const auth = await authorize(options?.permission, options?.role)
        ctx.user = auth

        // ผูก tenant context ให้ทั้ง handler — prisma จะกรอง tenantId ให้อัตโนมัติ
        // ทำให้ route ใหม่ได้ isolation ฟรีโดยไม่ต้องจำส่ง tenantId เอง
        return await runWithTenantContext({ tenantId: auth.tenantId, userId: auth.userId }, () =>
          handler(req, ctx)
        )
      })
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }
  }
}
