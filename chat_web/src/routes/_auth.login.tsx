import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSignin } from '@/hooks/use-auth'
import { signinSchema } from '@/schemas/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import type { SigninInput } from '@/schemas/auth'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const signin = useSignin()
  const [form, setForm] = useState<SigninInput>({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = signinSchema.safeParse(form)
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
    signin.mutate(result.data, {
      onError: (err) => toast.error('登录失败', { description: err.message }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">登录</h1>
        <p className="text-muted-foreground mt-2">登录到 Chat 工作空间</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="user@example.com"
          />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={signin.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {signin.isPending ? '登录中...' : '登录'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        没有账号？{' '}
        <button
          onClick={() => void navigate({ to: '/register' })}
          className="text-primary underline-offset-4 hover:underline"
        >
          注册
        </button>
      </p>
    </div>
  )
}
