import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSignup } from '@/hooks/use-auth'
import { signupSchema } from '@/schemas/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import { User, Mail, Building2, Lock, Loader2, MessageSquarePlus } from 'lucide-react'
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div
          className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: 'rgba(79, 70, 229, 0.10)' }}
        >
          <MessageSquarePlus size={20} style={{ color: '#4f46e5' }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">创建账号</h1>
        <p className="text-sm text-muted-foreground">开始使用 Chat 协作</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">姓名</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <User size={16} />
            </div>
            <input
              value={form.fullname}
              onChange={(e) => update('fullname', e.target.value)}
              className="input pl-10"
              placeholder="张三"
              autoComplete="name"
            />
          </div>
          {errors.fullname && <p className="mt-1.5 text-xs text-destructive">{errors.fullname}</p>}
        </div>

        <div>
          <label className="label">邮箱</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input pl-10"
              placeholder="user@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div>
          <label className="label">工作空间</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Building2 size={16} />
            </div>
            <input
              value={form.workspace}
              onChange={(e) => update('workspace', e.target.value)}
              className="input pl-10"
              placeholder="my-workspace"
              autoComplete="organization"
            />
          </div>
          {errors.workspace && <p className="mt-1.5 text-xs text-destructive">{errors.workspace}</p>}
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
              onChange={(e) => update('password', e.target.value)}
              className="input pl-10"
              placeholder="至少 6 个字符"
              autoComplete="new-password"
            />
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={signup.isPending}
          className="btn-primary w-full"
        >
          {signup.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              注册中
            </>
          ) : '创建账号'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        已有账号？{' '}
        <button
          onClick={() => void navigate({ to: '/login' })}
          className="link"
        >
          登录
        </button>
      </p>
    </div>
  )
}
