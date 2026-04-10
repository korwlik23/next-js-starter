import { z } from 'zod'

// ────────────────────────────────────────
// Tenant Module — Zod Validation Schemas
// ────────────────────────────────────────

/** สร้าง tenant ใหม่ */
export const CreateTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'ชื่อ tenant ต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อ tenant ต้องไม่เกิน 100 ตัวอักษร'),
  slug: z
    .string()
    .min(2, 'slug ต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'slug ต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-z0-9-]+$/, 'slug ต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือ -'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
})

/** อัปเดต tenant */
export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
})

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>
