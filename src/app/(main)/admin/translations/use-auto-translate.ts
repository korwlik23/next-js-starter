'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { autoTranslateRequest } from './api'

type Options = {
  locale: string
  failedMessage: string
  buildCompleteMessage: (result: { translated: number; skipped: number }) => string
  /** เรียกหลังแปลเสร็จ ใช้รีเฟรชรายการและเลื่อนตัวกรองไปดูผลลัพธ์ */
  onCompleted: () => Promise<void> | void
}

/**
 * สั่งแปลคำที่ยังขาดด้วยบริการภายนอก
 * ผลลัพธ์ถูกบันทึกเป็น machine_translated จึงยังต้องมีคนตรวจก่อนนำไปแสดงจริง
 */
export function useAutoTranslate({
  locale,
  failedMessage,
  buildCompleteMessage,
  onCompleted,
}: Options) {
  const [autoTranslating, setAutoTranslating] = useState(false)

  async function handleAutoTranslate() {
    setAutoTranslating(true)
    const res = await autoTranslateRequest(locale)
    setAutoTranslating(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? failedMessage)
      return
    }

    toast.success(buildCompleteMessage(res.data))
    await onCompleted()
  }

  return { autoTranslating, handleAutoTranslate }
}
