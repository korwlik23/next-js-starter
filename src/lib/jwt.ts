import { SignJWT, jwtVerify } from 'jose'
import type { TokenPayload, AuthTokens } from '@/types'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and contain at least 32 characters')
  }

  return new TextEncoder().encode(secret)
}

const secret = getJwtSecret()

function createTokenId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

// ─────────────────────────────────────────
// SIGN ACCESS TOKEN (short-lived)
// ─────────────────────────────────────────
export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES ?? '15m')
    .sign(secret)
}

// ─────────────────────────────────────────
// SIGN REFRESH TOKEN (long-lived)
// ─────────────────────────────────────────
export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(createTokenId())
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES ?? '7d')
    .sign(secret)
}

// ─────────────────────────────────────────
// VERIFY ACCESS TOKEN
// ─────────────────────────────────────────
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// ─────────────────────────────────────────
// VERIFY REFRESH TOKEN — returns userId
// ─────────────────────────────────────────
export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.sub ?? null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────
// SIGN BOTH TOKENS
// ─────────────────────────────────────────
export async function signAuthTokens(
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload.sub),
  ])
  return { accessToken, refreshToken }
}
