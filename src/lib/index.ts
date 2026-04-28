// ============================================================
// LIB — barrel export สำหรับ library modules
// ============================================================

// ─── Auth & JWT
export { getAuthUser, getAuthUserFromRequest, setAuthCookies, clearAuthCookies } from './auth'
export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signAuthTokens,
} from './jwt'

// ─── Permission & RBAC
export { can, canAll, canAny, hasRole } from './permissions'
export { CanAccessOwn, CanAccessTenant, CanWithAttribute, CanEditField } from './abac'
export {
  GetRoleLevel,
  GetHighestRole,
  IsRoleAboveOrEqual,
  IsRoleAbove,
  CanManageRole,
  GetAssignableRoles,
  GetAllRolesSorted,
} from './role-hierarchy'

// ─── Database & IDs
export { default as prisma } from './prisma'
export { GenerateId } from './ulid'

// ─── Security
export { SanitizeHtml, EscapeHtml, SanitizeInput, SanitizeObject, SanitizeEmail } from './sanitize'
export { CreateRateLimiter, AUTH_RATE_LIMITER, API_RATE_LIMITER, GetClientIp } from './rate-limit'

// ─── SaaS Features
export {
  CanAccessFeature,
  GetFeatureLimit,
  IsOverLimit,
  FEATURES,
  PLAN_LIMITS,
} from './feature-gate'
export { CreateAuditLog } from './audit'
export {
  CreateApiKey,
  ValidateApiKey,
  RevokeApiKey,
  ListApiKeys,
  GenerateApiKey,
  HashApiKey,
} from './api-key'
export {
  StartTrial,
  IsInTrial,
  IsTrialExpired,
  DowngradeExpiredTrials,
  GetTrialDaysRemaining,
} from './trial'
export { CheckUserLimit, CheckProjectLimit, CheckFileUploadLimit } from './usage-limit'

// ─── SSO
export {
  GetOAuthAuthorizeUrl,
  ExchangeCodeForToken,
  GetOAuthUserInfo,
  IsProviderConfigured,
  GetAvailableProviders,
} from './sso'

// ─── Stripe
export { GetStripeClient } from './stripe'

// ─── Logging
export { logger } from './logger'
