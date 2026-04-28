import { z } from 'zod'

// ────────────────────────────────────────
// Translation Schema — Zod validation
// ────────────────────────────────────────

export const upsertTranslationSchema = z.object({
  locale: z.string().min(2).max(5),
  namespace: z.string().min(1).max(50),
  key: z.string().min(1).max(100),
  value: z.string().min(1),
})

export const translationQuerySchema = z.object({
  locale: z.string().optional(),
  namespace: z.string().optional(),
  search: z.string().optional(),
})

export const bulkUpsertTranslationSchema = z.object({
  translations: z.array(upsertTranslationSchema).min(1).max(500),
})

export type UpsertTranslationInput = z.infer<typeof upsertTranslationSchema>
export type TranslationQuery = z.infer<typeof translationQuerySchema>
export type BulkUpsertTranslationInput = z.infer<typeof bulkUpsertTranslationSchema>
