import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at 0% 0%, rgba(79, 70, 229, 0.12) 0%, transparent 45%), ' +
          'radial-gradient(ellipse at 100% 100%, rgba(99, 102, 241, 0.10) 0%, transparent 45%), ' +
          '#f8f9fb',
      }}
    >
      <div className="w-full max-w-[420px] animate-fade-in">
        <div
          className="rounded-2xl border p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderColor: 'rgba(228, 231, 236, 0.8)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.07), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}
