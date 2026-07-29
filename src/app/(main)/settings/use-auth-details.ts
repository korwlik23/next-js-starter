'use client'

import { useCallback, useState } from 'react'
import { fetchAuthDetailsRequest } from './api'
import type { AuthDetails } from './types'

/**
 * สถานะบัญชีที่อ่านสดจากเซิร์ฟเวอร์
 *
 * แยกจาก authStore เพราะ token อาจเก่ากว่าความจริง เช่นเพิ่งยืนยันอีเมล
 * หรือเพิ่งเปิด MFA — หน้านี้ต้องแสดงสถานะล่าสุดเสมอ
 */
export function useAuthDetails() {
  const [authDetails, setAuthDetails] = useState<AuthDetails | null>(null)

  const loadAuthDetails = useCallback(async () => {
    const result = await fetchAuthDetailsRequest()
    if (!result.error && result.data) {
      setAuthDetails(result.data)
    }
  }, [])

  return { authDetails, setAuthDetails, loadAuthDetails }
}
