export * from './app.config'
export * from './auth.config'
export * from './billing.config'
export * from './feature-flags.config'
export * from './seo.config'

// ─────────────────────────────────────────
// PAGINATION DEFAULTS
// ─────────────────────────────────────────
export const paginationConfig = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
} as const
