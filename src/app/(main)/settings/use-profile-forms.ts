'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { changePasswordRequest, updateProfileRequest } from './api'
import type { AuthDetails, PasswordFormValues, ProfileFormValues, SettingsUser } from './types'

type Messages = {
  nameRequired: string
  invalidEmail: string
  currentPasswordRequired: string
  passwordMin: string
  confirmPasswordRequired: string
  passwordMismatch: string
  profileSaveSuccess: string
  profileSaveError: string
  passwordSaveSuccess: string
  passwordSaveError: string
}

type Options = {
  user: SettingsUser | null
  setUser: (user: any) => void
  setAuthDetails: (updater: (current: AuthDetails | null) => AuthDetails | null) => void
  messages: Messages
}

/**
 * ฟอร์มโปรไฟล์และเปลี่ยนรหัสผ่าน
 *
 * schema ถูกสร้างใหม่เมื่อข้อความแปลเปลี่ยน เพื่อให้ข้อความ validation
 * ตามภาษาที่ผู้ใช้เลือก
 */
export function useProfileForms({ user, setUser, setAuthDetails, messages }: Options) {
  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, messages.nameRequired),
        email: z.string().email(messages.invalidEmail),
      }),
    [messages.nameRequired, messages.invalidEmail]
  )

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, messages.currentPasswordRequired),
          password: z.string().min(6, messages.passwordMin),
          confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: messages.passwordMismatch,
          path: ['confirmPassword'],
        }),
    [
      messages.currentPasswordRequired,
      messages.passwordMin,
      messages.confirmPasswordRequired,
      messages.passwordMismatch,
    ]
  )

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!user) return
    try {
      const result = await updateProfileRequest(user.id, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setUser({ ...user, name: data.name, email: data.email })
      setAuthDetails((current) =>
        current ? { ...current, name: data.name, email: data.email } : current
      )
      toast.success(messages.profileSaveSuccess)
    } catch {
      toast.error(messages.profileSaveError)
    }
  }

  const onSubmitPassword = async (data: PasswordFormValues) => {
    if (!user) return
    try {
      const result = await changePasswordRequest(user.id, {
        currentPassword: data.currentPassword,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(messages.passwordSaveSuccess)
      passwordForm.reset()
    } catch {
      toast.error(messages.passwordSaveError)
    }
  }

  return { profileForm, passwordForm, onSubmitProfile, onSubmitPassword }
}
