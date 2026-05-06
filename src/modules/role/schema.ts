import { z } from 'zod'

interface RoleSchemaMessages {
  nameMin: string
  nameMax: string
  namePattern: string
}

const defaultMessages: RoleSchemaMessages = {
  nameMin: 'Role name must be at least 2 characters',
  nameMax: 'Role name must be at most 50 characters',
  namePattern: 'Role name must use lowercase letters, numbers, underscores, or hyphens only',
}

export function createRoleSchemaFactory(messages: RoleSchemaMessages = defaultMessages) {
  return z.object({
    name: z
      .string()
      .min(2, messages.nameMin)
      .max(50, messages.nameMax)
      .regex(/^[a-z0-9_-]+$/, messages.namePattern),
    description: z.string().max(255).optional(),
    permission_ids: z.array(z.string()).optional().default([]),
  })
}

export function updateRoleSchemaFactory(messages: RoleSchemaMessages = defaultMessages) {
  return z.object({
    name: z
      .string()
      .min(2, messages.nameMin)
      .max(50, messages.nameMax)
      .regex(/^[a-z0-9_-]+$/, messages.namePattern)
      .optional(),
    description: z.string().max(255).optional().nullable(),
    permission_ids: z.array(z.string()).optional(),
  })
}

export const createRoleSchema = createRoleSchemaFactory()
export const updateRoleSchema = updateRoleSchemaFactory()

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
