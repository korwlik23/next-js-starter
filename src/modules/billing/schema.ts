import { z } from 'zod'

// ────────────────────────────────────────
// Billing Schema
// ────────────────────────────────────────

export const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise', 'free']),
  tenantId: z.string().min(1, 'Tenant ID is required'),
})

export type CheckoutSchema = z.infer<typeof checkoutSchema>

export const webhookSchema = z.object({
  // Schema สำหรับ Webhook พื้นฐาน
})
