import { z } from 'zod'

export const createChatSchema = z.object({
  name: z.string().max(64).optional(),
  members: z.array(z.number().int().positive()).min(1, '至少选择 1 位成员'),
  public: z.boolean(),
})
export type CreateChatInput = z.infer<typeof createChatSchema>

export const updateChatSchema = z.object({
  name: z.string().max(64).optional(),
  members: z.array(z.number().int().positive()).optional(),
  public: z.boolean().optional(),
})
export type UpdateChatInput = z.infer<typeof updateChatSchema>
