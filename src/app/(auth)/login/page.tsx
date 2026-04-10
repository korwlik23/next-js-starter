'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/modules/auth/schema'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

// ────────────────────────────────────────
// Login Page — ตาม editorial template "login_authentication"
// Design: minimal, centered, editorial typography
// ────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [server_error, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  /* ฟังก์ชัน submit — เรียก API login */
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
      router.push('/dashboard')
    } catch {
      setServerError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* Brand — icon + ชื่อแอป + tagline */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: 'var(--color-primary)' }}
          >
            auto_awesome
          </span>
        </div>
        <h1
          className="font-extrabold text-2xl tracking-tighter uppercase mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'The Digital Gallery'}
        </h1>
        <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--color-text-subtle)' }}>
          CMS Admin Portal
        </p>
      </div>

      {/* Card — ฟอร์ม login */}
      <div
        className="w-full p-8 sm:p-12 editorial-card-elevated"
      >
        <header className="mb-10">
          <h2
            className="font-bold text-xl tracking-tight mb-2"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign In
          </h2>
          <p style={{ color: 'var(--color-text-subtle)' }} className="text-sm">
            Enter your credentials to access the editorial suite.
          </p>
        </header>

        <form onSubmit={handleSubmit(HandleSubmit)} className="space-y-8" noValidate>
          {/* Email field */}
          <div>
            <label
              className="label-xs block mb-1"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@digitalgallery.com"
              className="editorial-input w-full"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <label
                className="label-xs block"
                style={{ color: 'var(--color-text-subtle)' }}
                htmlFor="password"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="editorial-input w-full"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                {errors.password.message}
              </p>
            )}
            {/* Forgot password link */}
            <div className="mt-3 flex justify-end">
              <Link
                href="/forgot-password"
                className="label-xs transition-colors hover:opacity-70"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Server error message */}
          {server_error && (
            <div
              className="text-sm px-4 py-3"
              style={{
                color: 'var(--color-error)',
                backgroundColor: 'var(--color-error-container)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {server_error}
            </div>
          )}

          {/* Submit button — editorial primary action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-xs tracking-widest uppercase font-bold transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
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
                  Authenticate
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                    arrow_right_alt
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Single Sign-On */}
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs text-center uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>
            Or continue with
          </p>
          <div className="flex gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/login`}
              className="flex-1 py-3 text-xs tracking-wider uppercase font-bold text-center rounded transition-opacity hover:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-surface-mid)', color: 'var(--color-text)' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              Google
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/login`}
              className="flex-1 py-3 text-xs tracking-wider uppercase font-bold text-center rounded transition-opacity hover:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-surface-mid)', color: 'var(--color-text)' }}
            >
              <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Footer — authorized message */}
      <footer className="mt-12 text-center">
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          Authorized use only.{' '}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4 transition-all hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            Register
          </Link>
        </p>
      </footer>
    </div>
  )
}
