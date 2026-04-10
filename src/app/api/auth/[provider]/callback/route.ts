import { NextRequest } from 'next/server'
import { successResponse, badRequest, serverError } from '@/utils/api'
import { ExchangeCodeForToken, GetOAuthUserInfo } from '@/lib/sso'
import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { authConfig } from '@/config'
import { CreateAuditLog } from '@/lib/audit'
import { NextResponse } from 'next/server'

// ────────────────────────────────────────
// OAuth Callback — /api/auth/[provider]/callback
// รับ authorization code จาก provider → สร้าง/login user
// ────────────────────────────────────────

interface RouteParams {
  params: Promise<{ provider: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { provider } = await params
    const code = request.nextUrl.searchParams.get('code')

    if (!code) return badRequest('Missing authorization code')

    // สร้าง callback URL สำหรับ exchange
    const callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/${provider}/callback`

    // 1. แลก code เป็น access token
    const token_data = await ExchangeCodeForToken(provider, code, callback_url)
    if (!token_data) return badRequest('Failed to exchange token')

    // 2. ดึงข้อมูลผู้ใช้จาก provider
    const user_info = await GetOAuthUserInfo(provider, token_data.access_token)
    if (!user_info) return badRequest('Failed to get user info')

    // 3. ค้นหา account ที่ผูกแล้ว
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: user_info.provider_id,
        },
      },
      include: {
        user: {
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        },
      },
    })

    let user_id: string

    if (account) {
      // User exists — login
      user_id = account.userId

      // อัปเดต token ล่าสุด
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: token_data.access_token,
        },
      })
    } else {
      // ค้นหาด้วย email ก่อน — อาจมี user อยู่แล้วจาก password login
      let existing_user = await prisma.user.findUnique({
        where: { email: user_info.email },
      })

      if (!existing_user) {
        // สร้าง user ใหม่
        existing_user = await prisma.user.create({
          data: {
            id: GenerateId(),
            name: user_info.name,
            email: user_info.email,
            password: '', // SSO user ไม่มี password
            avatar: user_info.avatar,
          },
        })

        // Assign default 'member' role
        const member_role = await prisma.role.findFirst({
          where: { name: 'member', tenantId: null },
        })

        if (member_role) {
          await prisma.userRole.create({
            data: { userId: existing_user.id, roleId: member_role.id },
          })
        }
      }

      user_id = existing_user.id

      // ผูก account กับ user
      await prisma.account.create({
        data: {
          id: GenerateId(),
          userId: user_id,
          provider,
          providerAccountId: user_info.provider_id,
          access_token: token_data.access_token,
        },
      })
    }

    // 4. โหลด user + roles + permissions สำหรับ JWT
    const full_user = await prisma.user.findUnique({
      where: { id: user_id },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    })

    if (!full_user) return badRequest('User not found')

    // สร้าง JWT payload
    const roles = full_user.roles.map((ur) => ur.role.name)
    const permissions = [
      ...new Set(
        full_user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.name))
      ),
    ]

    const payload = {
      sub: full_user.id,
      email: full_user.email,
      name: full_user.name,
      roles,
      permissions,
      tenantId: full_user.tenantId,
    }

    // 5. สร้าง JWT tokens
    const access_token = await signAccessToken(payload)
    const refresh_token = await signRefreshToken(full_user.id)

    // บันทึก Audit Log
    await CreateAuditLog({
      action: 'USER_SSO_LOGIN',
      userId: full_user.id,
      entity: 'User',
      entityId: full_user.id,
      metadata: { provider },
    })

    // 6. Redirect ไป dashboard พร้อม set cookies
    const redirect_url = new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL)
    const response = NextResponse.redirect(redirect_url)

    response.cookies.set(authConfig.cookieName.accessToken, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 นาที
    })

    response.cookies.set(authConfig.cookieName.refreshToken, refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 วัน
    })

    return response
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'SSO callback failed')
  }
}
