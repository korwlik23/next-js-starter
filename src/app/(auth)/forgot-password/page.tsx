'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/modules/auth/schema'
import { api } from '@/services/apiClient'
import { toast } from 'react-hot-toast'

// ────────────────────────────────────────
// Forgot Password Page — ขอรีเซ็ตรหัสผ่าน
// ใช้ editorial design เดียวกับ login
// ────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [is_sent, setIsSent] = useState(false)
  const [sent_email, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  /* ฟังก์ชัน submit — ส่ง reset link */
  async function HandleSubmit(data: ForgotPasswordInput) {
    try {
      const res = await api.post('/api/auth/forgot-password', data)
      if (res.error) {
        toast.error(res.error)
      } else {
        setSentEmail(data.email)
        setIsSent(true)
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* Brand */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: 'var(--color-primary)' }}
          >
            lock_reset
          </span>
        </div>
        <h1
          className="font-extrabold text-2xl tracking-tighter uppercase mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          Forgot Password
        </h1>
        <p
          className="text-[10px] tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          Account Recovery
        </p>
      </div>

      {/* Card */}
      <div className="w-full p-8 sm:p-12 editorial-card-elevated">
        {is_sent ? (
          /* สถานะส่งสำเร็จ */
          <div className="text-center py-4">
            <span
              className="material-symbols-outlined text-5xl mb-4 block"
              style={{ color: 'var(--color-success)' }}
            >
              mark_email_read
            </span>
            <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--color-primary)' }}>
              Check your email
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-subtle)' }}>
              We sent a reset link to
              <br />
              <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {sent_email}
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              Didn&apos;t receive it? Check your spam folder.
            </p>
          </div>
        ) : (
          /* ฟอร์มกรอก email */
          <>
            <header className="mb-10">
              <h2
                className="font-bold text-xl tracking-tight mb-2"
                style={{ color: 'var(--color-primary)' }}
              >
                Reset Password
              </h2>
              <p style={{ color: 'var(--color-text-subtle)' }} className="text-sm">
                Enter your email address and we&apos;ll send you a reset link.
              </p>
            </header>

            <form onSubmit={handleSubmit(HandleSubmit)} className="space-y-8" noValidate>
              <div>
                <label
                  className="label-xs block mb-1"
                  style={{ color: 'var(--color-text-subtle)' }}
                  htmlFor="fp-email"
                >
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="editorial-input w-full"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

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
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                        arrow_right_alt
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <Link
          href="/login"
          className="text-xs transition-colors hover:opacity-70 flex items-center gap-1 justify-center"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Sign In
        </Link>
      </footer>
    </div>
  )
}
