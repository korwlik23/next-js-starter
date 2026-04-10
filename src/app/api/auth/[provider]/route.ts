import { NextRequest, NextResponse } from 'next/server'
import { badRequest } from '@/utils/api'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { ExchangeCodeForToken, GetOAuthUserInfo, IsProviderConfigured } from '@/lib/sso'
import { signAuthTokens } from '@/lib/jwt'
import { setAuthCookies } from '@/lib/auth'

// ─────────────────────────────────────────
// SSO / OAUTH PROVIDER CALLBACK
// ─────────────────────────────────────────
// GET /api/auth/[provider]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const resolvedParams = await params
    const provider = resolvedParams.provider
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return badRequest('Missing authorization code')
    }

    if (!IsProviderConfigured(provider)) {
      return badRequest(`Provider ${provider} is not configured yet`)
    }

    logger.info(`[SSO] Processing OAuth callback for provider: ${provider}`)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/auth/${provider}`

    // ─────────────────────────────────────────
    // 1. แลก Code เป็น Token และดึงโปรไฟล์
    // ─────────────────────────────────────────
    const tokenRes = await ExchangeCodeForToken(provider, code, redirectUri)
    if (!tokenRes?.access_token) {
      throw new Error('Failed to exchange authorization code for token')
    }

    const userProfile = await GetOAuthUserInfo(provider, tokenRes.access_token)
    if (!userProfile?.email) {
      throw new Error('Failed to retrieve email from provider')
    }

    // ─────────────────────────────────────────
    // 2. เช็คว่ามี User ในระบบหรือยัง? ถ้ายังให้สร้างอัตโนมัติ (Auto-register)
    // ─────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { email: userProfile.email },
    })

    if (!user) {
      const { ulid } = await import('ulid')
      user = await prisma.user.create({
        data: {
          id: ulid(),
          name: userProfile.name,
          email: userProfile.email,
          password: '', // ไม่มีพาสเวิร์ดเนื่องจากมาจาก SSO
          avatar: userProfile.avatar,
        },
      })
      logger.info(`[SSO] Created new user via ${provider}: ${user.email}`)
    } else if (!user.avatar && userProfile.avatar) {
      // Update avatar if not present
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: userProfile.avatar }
      })
    }

    // ─────────────────────────────────────────
    // 3. ผูก Account หรืออัปเดตข้อมูลของ SSO Provider
    // ─────────────────────────────────────────
    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId: userProfile.provider_id } },
      create: {
        id: (await import('ulid')).ulid(),
        userId: user.id,
        provider,
        providerAccountId: userProfile.provider_id,
      },
      update: {},
    })

    // ─────────────────────────────────────────
    // 4. สร้าง JWT Token & Set Cookies
    // ─────────────────────────────────────────
    // Fetch user roles for token
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true }
    })
    const roles = userRoles.map(ur => ur.role.name)
    // Merge direct permissions if needed, here we simplify for SSO auto-register:
    const permissions: string[] = [] // Default empty directly, derived from roles later
    const tokens = await signAuthTokens({ sub: user.id, roles, permissions, name: user.name, email: user.email })
    
    // Redirect ส่งกลับไปที่หน้าหลักระบบพร้อม set cookies
    const response = NextResponse.redirect(`${appUrl}/dashboard?sso_success=1`)
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return response

  } catch (error: any) {
    logger.error('SSO Callback error:', { message: error.message, error })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/login?error=sso_failed`)
  }
}

