import { z } from 'zod'

export const createMessageSchema = z.object({
  content: z.string().min(1, '消息内容不能为空'),
  files: z.array(z.string()).default([]),
})
export type CreateMessageInput = z.infer<typeof createMessageSchema>
