import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const result = await login(form.email, form.password)

    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_32%)]" />


      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] shadow-lg">
            <img
              src="/logo.png"
              alt="Portfolio CMS Logo"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">
              Portfolio CMS
            </h1>
            <p className="text-sm text-white/30">
              Sign in to your dashboard
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                Email
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}