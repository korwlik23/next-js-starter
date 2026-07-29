'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { confirmMfaSetupRequest, disableMfaRequest, startMfaSetupRequest } from './api'
import type { AuthDetails, MfaSetupState, SettingsUser } from './types'

type Options = {
  user: SettingsUser | null
  setUser: (user: any) => void
  setAuthDetails: (updater: (current: AuthDetails | null) => AuthDetails | null) => void
}

/**
 * ตั้งค่าและปิด TOTP MFA
 *
 * secret จะถูกแสดงเฉพาะช่วงตั้งค่าและหายไปทันทีที่ยืนยันสำเร็จ
 * recovery code แสดงครั้งเดียวหลังเปิดใช้งาน เซิร์ฟเวอร์เก็บแค่ hash
 */
export function useMfaSettings({ user, setUser, setAuthDetails }: Options) {
  const [isStartingMfa, setIsStartingMfa] = useState(false)
  const [isConfirmingMfa, setIsConfirmingMfa] = useState(false)
  const [isDisablingMfa, setIsDisablingMfa] = useState(false)
  const [mfaSetup, setMfaSetup] = useState<MfaSetupState | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaDisableCode, setMfaDisableCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const handleStartMfa = async () => {
    setIsStartingMfa(true)
    setRecoveryCodes([])
    try {
      const result = await startMfaSetupRequest()
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Unable to start MFA setup')
        return
      }

      setMfaSetup(result.data)
      setMfaCode('')
    } catch {
      toast.error('Unable to start MFA setup')
    } finally {
      setIsStartingMfa(false)
    }
  }

  const handleConfirmMfa = async () => {
    if (!mfaCode.trim()) {
      toast.error('Authentication code is required')
      return
    }

    setIsConfirmingMfa(true)
    try {
      const result = await confirmMfaSetupRequest(mfaCode.trim())

      if (result.error || !result.data) {
        toast.error(result.error ?? 'Unable to enable MFA')
        return
      }

      setMfaSetup(null)
      setMfaCode('')
      setRecoveryCodes(result.data.recoveryCodes)
      setAuthDetails((current) => (current ? { ...current, mfaEnabled: true } : current))
      setUser(user ? { ...user, mfaEnabled: true } : user)
      toast.success('MFA enabled')
    } catch {
      toast.error('Unable to enable MFA')
    } finally {
      setIsConfirmingMfa(false)
    }
  }

  const handleDisableMfa = async () => {
    if (!mfaDisableCode.trim()) {
      toast.error('Authentication code is required')
      return
    }

    setIsDisablingMfa(true)
    try {
      const result = await disableMfaRequest(mfaDisableCode.trim())

      if (result.error) {
        toast.error(result.error)
        return
      }

      setMfaDisableCode('')
      setRecoveryCodes([])
      setAuthDetails((current) => (current ? { ...current, mfaEnabled: false } : current))
      setUser(user ? { ...user, mfaEnabled: false } : user)
      toast.success('MFA disabled')
    } catch {
      toast.error('Unable to disable MFA')
    } finally {
      setIsDisablingMfa(false)
    }
  }

  return {
    isStartingMfa,
    isConfirmingMfa,
    isDisablingMfa,
    mfaSetup,
    setMfaSetup,
    mfaCode,
    setMfaCode,
    mfaDisableCode,
    setMfaDisableCode,
    recoveryCodes,
    handleStartMfa,
    handleConfirmMfa,
    handleDisableMfa,
  }
}
