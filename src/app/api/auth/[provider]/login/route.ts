import { NextRequest, NextResponse } from 'next/server'
import { GetOAuthAuthorizeUrl, IsProviderConfigured } from '@/lib/sso'

// ─────────────────────────────────────────
// SSO LOGIN INITIATOR
// ─────────────────────────────────────────
// GET /api/auth/[provider]/login

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const resolvedParams = await params
  const provider = resolvedParams.provider

  if (!IsProviderConfigured(provider)) {
    return NextResponse.json({ error: `Provider ${provider} is not configured` }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackUrl = `${appUrl}/api/auth/${provider}/callback`

  const authorizeUrl = GetOAuthAuthorizeUrl(provider, callbackUrl)

  if (!authorizeUrl) {
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 })
  }

  return NextResponse.redirect(authorizeUrl)
}
