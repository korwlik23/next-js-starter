import { z } from 'zod'

// ────────────────────────────────────────
// Feature Flag Schema — Zod validation
// ────────────────────────────────────────

export const updateFeatureFlagSchema = z.object({
  key: z.string().min(1, 'Feature key is required'),
  enabled: z.boolean(),
})

export const featureFlagQuerySchema = z.object({
  search: z.string().optional(),
  enabledOnly: z.coerce.boolean().optional(),
})

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>
export type FeatureFlagQuery = z.infer<typeof featureFlagQuerySchema>
