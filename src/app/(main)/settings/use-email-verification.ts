'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { resendVerificationRequest } from './api'

/**
 * ส่งอีเมลยืนยันซ้ำ
 * ถ้าเซิร์ฟเวอร์ตอบว่ายืนยันไปแล้ว ให้โหลดสถานะบัญชีใหม่เพื่อให้หน้าจอตรงกับความจริง
 */
export function useEmailVerification(onAlreadyVerified: () => Promise<void> | void) {
  const [isSendingVerification, setIsSendingVerification] = useState(false)

  const handleResendVerification = async () => {
    setIsSendingVerification(true)
    try {
      const result = await resendVerificationRequest()

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.alreadyVerified) {
        await onAlreadyVerified()
        toast.success('Email is already verified')
        return
      }

      toast.success('Verification email sent')
    } catch {
      toast.error('Unable to send verification email')
    } finally {
      setIsSendingVerification(false)
    }
  }

  return { isSendingVerification, handleResendVerification }
}
