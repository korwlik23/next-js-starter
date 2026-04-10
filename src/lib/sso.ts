// ────────────────────────────────────────
// SSO — Social Sign-On Helper Functions
// รองรับ Google OAuth + GitHub OAuth
// ────────────────────────────────────────

import { logger } from '@/lib/logger'

// ─── OAuth Provider Config
interface OAuthProviderConfig {
  client_id: string
  client_secret: string
  authorize_url: string
  token_url: string
  userinfo_url: string
  scopes: string[]
}

// ─── Provider configurations
const PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    token_url: 'https://oauth2.googleapis.com/token',
    userinfo_url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  github: {
    client_id: process.env.GITHUB_CLIENT_ID ?? '',
    client_secret: process.env.GITHUB_CLIENT_SECRET ?? '',
    authorize_url: 'https://github.com/login/oauth/authorize',
    token_url: 'https://github.com/login/oauth/access_token',
    userinfo_url: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
  },
}

/**
 * สร้าง URL สำหรับ redirect ไปหน้า login ของ provider
 */
export function GetOAuthAuthorizeUrl(provider: string, callback_url: string): string | null {
  const config = PROVIDERS[provider]
  if (!config || !config.client_id) {
    logger.warn(`[SSO] Provider '${provider}' is not configured`)
    return null
  }

  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: callback_url,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: GenerateState(),
  })

  return `${config.authorize_url}?${params.toString()}`
}

/**
 * แลก authorization code เป็น access token
 */
export async function ExchangeCodeForToken(
  provider: string,
  code: string,
  redirect_uri: string
): Promise<{ access_token: string; token_type: string } | null> {
  const config = PROVIDERS[provider]
  if (!config) return null

  try {
    const res = await fetch(config.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        code,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) {
      logger.error(`[SSO] Token exchange failed for ${provider}`, { status: res.status })
      return null
    }

    return await res.json()
  } catch (error) {
    logger.error(`[SSO] Token exchange error for ${provider}`, { error })
    return null
  }
}

/**
 * ดึงข้อมูลผู้ใช้จาก provider ด้วย access token
 */
export async function GetOAuthUserInfo(
  provider: string,
  access_token: string
): Promise<{ email: string; name: string; avatar?: string; provider_id: string } | null> {
  const config = PROVIDERS[provider]
  if (!config) return null

  try {
    const res = await fetch(config.userinfo_url, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!res.ok) return null

    const data = await res.json()

    // แปลงข้อมูลให้อยู่ในรูปแบบเดียวกัน
    if (provider === 'google') {
      return {
        email: data.email,
        name: data.name,
        avatar: data.picture,
        provider_id: data.sub,
      }
    }

    if (provider === 'github') {
      return {
        email: data.email,
        name: data.name || data.login,
        avatar: data.avatar_url,
        provider_id: String(data.id),
      }
    }

    return null
  } catch (error) {
    logger.error(`[SSO] UserInfo fetch error for ${provider}`, { error })
    return null
  }
}

/**
 * ตรวจสอบว่า provider ถูก configure แล้วหรือไม่
 */
export function IsProviderConfigured(provider: string): boolean {
  const config = PROVIDERS[provider]
  return !!(config?.client_id && config?.client_secret)
}

/**
 * สร้าง random state สำหรับ CSRF protection
 */
function GenerateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * รายชื่อ providers ที่พร้อมใช้งาน
 */
export function GetAvailableProviders(): string[] {
  return Object.keys(PROVIDERS).filter(IsProviderConfigured)
}
