import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSignup } from '@/hooks/use-auth'
import { signupSchema } from '@/schemas/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import type { SignupInput } from '@/schemas/auth'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  const [form, setForm] = useState<SignupInput>({
    fullname: '',
    email: '',
    workspace: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = signupSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    signup.mutate(result.data, {
      onError: (err) => toast.error('注册失败', { description: err.message }),
    })
  }

  const update = (key: keyof SignupInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">注册</h1>
        <p className="text-muted-foreground mt-2">创建新的 Chat 账号</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">姓名</label>
          <input
            value={form.fullname}
            onChange={(e) => update('fullname', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="张三"
          />
          {errors.fullname && <p className="text-destructive text-xs mt-1">{errors.fullname}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="user@example.com"
          />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">工作空间</label>
          <input
            value={form.workspace}
            onChange={(e) => update('workspace', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="my-workspace"
          />
          {errors.workspace && <p className="text-destructive text-xs mt-1">{errors.workspace}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={signup.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {signup.isPending ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        已有账号？{' '}
        <button
          onClick={() => void navigate({ to: '/login' })}
          className="text-primary underline-offset-4 hover:underline"
        >
          登录
        </button>
      </p>
    </div>
  )
}
