import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSignin } from '@/hooks/use-auth'
import { signinSchema } from '@/schemas/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import { Mail, Lock, Loader2, MessageSquare } from 'lucide-react'
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
      <div className="text-center space-y-2">
        <div
          className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: 'rgba(79, 70, 229, 0.10)' }}
        >
          <MessageSquare size={20} style={{ color: '#4f46e5' }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">登录到您的 Chat 工作空间</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">邮箱</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input pl-10"
              placeholder="user@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div>
          <label className="label">密码</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock size={16} />
            </div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input pl-10"
              placeholder="至少 6 个字符"
              autoComplete="current-password"
            />
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={signin.isPending}
          className="btn-primary w-full"
        >
          {signin.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              登录中
            </>
          ) : '登录'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        没有账号？{' '}
        <button
          onClick={() => void navigate({ to: '/register' })}
          className="link"
        >
          创建账号
        </button>
      </p>
    </div>
  )
}
