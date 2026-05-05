import { z } from 'zod'

// ─────────────────────────────────────────
// CREATE ROLE SCHEMA
// ─────────────────────────────────────────
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'ชื่อ Role ต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อ Role ต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-z0-9_-]+$/, 'ชื่อ Role ต้องเป็นตัวพิมพ์เล็ก a-z, 0-9, _ หรือ - เท่านั้น'),
  description: z.string().max(255).optional(),
  // รายการ Permission ID ที่ต้องการผูกกับ Role นี้
  permission_ids: z.array(z.string()).optional().default([]),
})

// ─────────────────────────────────────────
// UPDATE ROLE SCHEMA
// ─────────────────────────────────────────
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'ชื่อ Role ต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อ Role ต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-z0-9_-]+$/, 'ชื่อ Role ต้องเป็นตัวพิมพ์เล็ก a-z, 0-9, _ หรือ - เท่านั้น')
    .optional(),
  description: z.string().max(255).optional().nullable(),
  // ถ้าส่ง permission_ids มา ระบบจะ sync สิทธิ์ใหม่ทั้งหมด (replace old)
  permission_ids: z.array(z.string()).optional(),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
