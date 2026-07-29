import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import type { TokenPayload } from '@/types'
import { REFRESH_TOKEN_EXPIRES_MS } from './constants'

/**
 * โหลดผู้ใช้พร้อม role และ permission ที่ผูกกับ role
 *
 * ไม่ include `permissions` (direct user grant) โดยเจตนา — สิทธิ์มาจาก role
 * เท่านั้น ดูเหตุผลเต็มใน @/lib/authorize
 */
export async function GetUserWithPermissions(user_id: string) {
  return prisma.user.findUnique({
    where: { id: user_id, deletedAt: null },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  })
}

/**
 * สร้าง payload ของ token จากผู้ใช้ที่โหลดมาแล้ว
 *
 * นับเฉพาะ role ที่อยู่ใน tenant เดียวกับผู้ใช้ เพื่อไม่ให้ role ของ tenant อื่น
 * หลุดเข้ามาใน token
 */
export function BuildTokenPayload(
  user: Awaited<ReturnType<typeof GetUserWithPermissions>>
): TokenPayload {
  if (!user) throw new Error('User not found')

  const scoped_roles = user.roles.filter((ur) => {
    if (!user.tenantId) return ur.tenantId == null && ur.role.tenantId == null
    return ur.tenantId === user.tenantId || ur.role.tenantId === user.tenantId
  })

  const permissions = [
    ...new Set(scoped_roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.name))),
  ]

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    roles: scoped_roles.map((ur) => ur.role.name),
    permissions,
    tenantId: user.tenantId,
  }
}

/**
 * บันทึก refresh token ที่เพิ่งออกให้ผู้ใช้
 * รวมไว้ที่เดียวเพราะ login, register และ MFA ต่างต้องใช้อายุชุดเดียวกัน
 *
 * `sessionId` คือ id ของแถวนี้ และถูกฝังไว้ใน access token ด้วย (`sid`)
 * ทำให้ตรวจได้ว่า access token ใบหนึ่งยังผูกกับ session ที่ยังไม่ถูกเพิกถอน
 */
export async function issueRefreshToken(
  userId: string,
  refreshToken: string,
  sessionId: string = GenerateId()
) {
  return prisma.refreshToken.create({
    data: {
      id: sessionId,
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  })
}

/** id ของ session ใหม่ ใช้ผูก access token กับ refresh-token record */
export function createSessionId() {
  return GenerateId()
}
