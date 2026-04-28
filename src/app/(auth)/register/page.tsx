'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/modules/auth/schema'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [server_error, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

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

  const FORM_FIELDS = [
    {
      id: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Your Name',
      field: 'name' as const,
    },
    {
      id: 'reg-email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'name@example.com',
      field: 'email' as const,
    },
    {
      id: 'reg-password',
      label: 'Password',
      type: 'password',
      placeholder: '••••••••',
      field: 'password' as const,
    },
    {
      id: 'reg-confirm',
      label: 'Confirm Password',
      type: 'password',
      placeholder: '••••••••',
      field: 'confirmPassword' as const,
    },
  ]

  return (
    <div className="w-full">
      {/* 1. FORM HEADER */}
      <header className="mb-10">
        <h1
          className="text-3xl font-black tracking-tighter mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Create account
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Join our professional platform and start managing your workspace.
        </p>
      </header>

      {/* 2. REGISTER FORM */}
      <form
        onSubmit={handleSubmit(HandleSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        noValidate
      >
        {FORM_FIELDS.map(({ id, label, type, placeholder, field }) => (
          <div key={id} className={field === 'name' || field === 'email' ? 'sm:col-span-2' : ''}>
            <label
              className="text-[10px] font-black uppercase tracking-widest mb-2 block"
              style={{ color: 'var(--color-text-subtle)' }}
              htmlFor={id}
            >
              {label}
            </label>
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              className="editorial-input w-full py-3 px-4 shadow-sm"
              {...register(field)}
            />
            {errors[field] && (
              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-error)' }}>
                {errors[field]?.message}
              </p>
            )}
          </div>
        ))}

        {/* Server error */}
        {server_error && (
          <div className="sm:col-span-2 p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">error</span>
            {server_error}
          </div>
        )}

        {/* Submit button */}
        <div className="sm:col-span-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--color-primary)]/10 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
                Creating account...
              </>
            ) : (
              <>
                Initialize My Workspace
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  rocket_launch
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
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span
              className="bg-[var(--color-surface)] px-4"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Or register with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/login`}
            className="flex items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/login`}
            className="flex items-center justify-center gap-3 py-3 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-low)] transition-all shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase tracking-widest">GitHub</span>
          </a>
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="mt-12 pt-8 border-t border-[var(--color-border)]/50 text-center">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-black text-[var(--color-primary)] hover:underline underline-offset-4 transition-all"
          >
            Sign In
          </Link>
        </p>
      </footer>
    </div>
  )
}
