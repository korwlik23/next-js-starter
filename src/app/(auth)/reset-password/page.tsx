'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Input, Button } from '@/components/ui'
import { resetPasswordSchema, type ResetPasswordInput } from '@/modules/auth/schema'
import { api } from '@/services/apiClient'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
    },
  })

  // หากไม่มี Token ไม่ให้ทำรายการ
  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          Link ไม่ถูกต้อง
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          ไม่พบ Token สำหรับการตั้งรหัสผ่านใหม่
          กรุณากรอกอีเมลเพื่อขอลิงก์เปลี่ยนรหัสผ่านใหม่อีกครั้ง
        </p>
        <Link
          href="/forgot-password"
          style={{ color: 'var(--color-primary)' }}
          className="text-sm font-semibold hover:underline"
        >
          กลับไปหน้าลืมรหัสผ่าน
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/reset-password', data)
      if (response.error) {
        toast.error(response.error)
        return
      }

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่')
      router.push('/login')
    } catch {
      toast.error('ไม่สามารถตั้งรหัสผ่านใหม่ได้')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h1
        className="text-3xl font-extrabold text-center mb-6"
        style={{ color: 'var(--color-text)' }}
      >
        ตั้งรหัสผ่านใหม่
      </h1>
      <p className="text-center mb-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('token')} />

        <Input
          label="รหัสผ่านใหม่"
          type="password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <Input
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" className="w-full h-12 mt-4" isLoading={isLoading}>
          เปลี่ยนรหัสผ่าน
        </Button>

        <p className="text-center mt-6 text-sm">
          <Link
            href="/login"
            style={{ color: 'var(--color-text-muted)' }}
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center">กำลังโหลด...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
