import { z } from 'zod'

export const signinSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 个字符'),
})
export type SigninInput = z.infer<typeof signinSchema>

export const signupSchema = z.object({
  fullname: z.string().min(1, '姓名不能为空').max(64),
  email: z.string().email('请输入有效的邮箱地址'),
  workspace: z.string().min(1, '工作空间名不能为空').max(32),
  password: z.string().min(6, '密码至少 6 个字符').max(97),
})
export type SignupInput = z.infer<typeof signupSchema>
