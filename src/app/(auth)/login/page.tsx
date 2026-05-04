'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/modules/auth/schema'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [server_error, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('email') || params.has('password')) {
      window.history.replaceState(null, '', '/login')
    }
  }, [])

  async function HandleSubmit(data: LoginInput) {
    setServerError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        const error_msg = json.message ?? 'เกิดข้อผิดพลาด'
        setServerError(error_msg)
        toast.error(error_msg)
        return
      }

      setUser(json.data.user)
      toast.success('เข้าสู่ระบบสำเร็จ')
      router.replace('/dashboard')
      router.refresh()
      window.location.assign('/dashboard')
    } catch {
      setServerError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  return (
    <div className="w-full">
      {/* 1. FORM HEADER */}
      <header className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-black mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Welcome back
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Enter your credentials to access your workspace.
        </p>
      </header>

      {/* 2. LOGIN FORM */}
      <form
        method="post"
        action="/api/auth/login"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit(HandleSubmit)(event)
        }}
        className="space-y-6"
        noValidate
      >
        {/* Email field */}
        <div className="space-y-2">
          <label
            className="text-[10px] font-black uppercase"
            style={{ color: 'var(--color-text-subtle)' }}
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="editorial-input w-full shadow-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label
              className="text-[10px] font-black uppercase"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor="password"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-black uppercase hover:text-[var(--color-primary)] transition-colors"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="editorial-input w-full shadow-sm"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error message */}
        {server_error && (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-black uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">error</span>
            {server_error}
          </div>
        )}

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full text-[10px] font-black uppercase shadow-sm flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Workspace
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_right_alt
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. SSO OPTIONS */}
      <div className="mt-10">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)] opacity-50" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase">
            <span
              className="bg-[var(--color-surface)] px-4"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/login`}
            className="flex min-h-11 items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase">Google</span>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/login`}
            className="flex min-h-11 items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase">GitHub</span>
          </a>
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="mt-12 pt-8 border-t border-[var(--color-border)]/50 text-center">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-black text-[var(--color-primary)] hover:underline underline-offset-4 transition-all"
          >
            Create Workspace
          </Link>
        </p>
      </footer>
    </div>
  )
}
