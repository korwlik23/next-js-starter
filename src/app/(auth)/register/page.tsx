'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/modules/auth/schema'
import toast from 'react-hot-toast'

// ────────────────────────────────────────
// Register Page — สร้างบัญชีใหม่
// ใช้ editorial design เดียวกับ login
// ────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const [server_error, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  /* ฟังก์ชัน submit — เรียก API register */
  async function HandleSubmit(data: RegisterInput) {
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
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
      toast.success('สร้างบัญชีสำเร็จ! กำลังนำคุณไปยัง Dashboard...')
      router.push('/dashboard')
    } catch {
      setServerError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  /* รายการ fields ของฟอร์ม */
  const FORM_FIELDS = [
    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your Name', field: 'name' as const },
    { id: 'reg-email', label: 'Email Address', type: 'email', placeholder: 'name@example.com', field: 'email' as const },
    { id: 'reg-password', label: 'Password', type: 'password', placeholder: '••••••••', field: 'password' as const },
    { id: 'reg-confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••', field: 'confirmPassword' as const },
  ]

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* Brand */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-primary)' }}>
            person_add
          </span>
        </div>
        <h1
          className="font-extrabold text-2xl tracking-tighter uppercase mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          Create Account
        </h1>
        <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--color-text-subtle)' }}>
          Join the platform
        </p>
      </div>

      {/* Card */}
      <div className="w-full p-8 sm:p-12 editorial-card-elevated">
        <header className="mb-10">
          <h2 className="font-bold text-xl tracking-tight mb-2" style={{ color: 'var(--color-primary)' }}>
            Register
          </h2>
          <p style={{ color: 'var(--color-text-subtle)' }} className="text-sm">
            Fill in your details to create an account.
          </p>
        </header>

        <form onSubmit={handleSubmit(HandleSubmit)} className="space-y-7" noValidate>
          {FORM_FIELDS.map(({ id, label, type, placeholder, field }) => (
            <div key={id}>
              <label
                className="label-xs block mb-1"
                style={{ color: 'var(--color-text-subtle)' }}
                htmlFor={id}
              >
                {label}
              </label>
              <input
                id={id}
                type={type}
                placeholder={placeholder}
                className="editorial-input w-full"
                {...register(field)}
              />
              {errors[field] && (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                  {errors[field]?.message}
                </p>
              )}
            </div>
          ))}

          {/* Server error */}
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

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-xs tracking-widest uppercase font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
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

      {/* Footer */}
      <footer className="mt-12 text-center">
        <Link href="/login" className="text-xs transition-colors hover:opacity-70" style={{ color: 'var(--color-text-faint)' }}>
          Already have an account?{' '}
          <span className="font-medium underline underline-offset-4" style={{ color: 'var(--color-primary)' }}>
            Sign In
          </span>
        </Link>
      </footer>
    </div>
  )
}
