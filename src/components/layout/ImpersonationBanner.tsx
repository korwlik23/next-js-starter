'use client'

import { useState } from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import enMessages from '../../../messages/en.json'
import thMessages from '../../../messages/th.json'

const dictionaries = {
  en: enMessages.components.impersonation,
  th: thMessages.components.impersonation,
}

function getClientLocale() {
  if (typeof document === 'undefined') return 'en'

  const cookieLocale = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('locale='))
    ?.split('=')[1]

  if (cookieLocale === 'th' || cookieLocale === 'en') return cookieLocale
  return navigator.language.toLowerCase().startsWith('th') ? 'th' : 'en'
}

export function ImpersonationBanner() {
  const { user, isImpersonating } = useAuth()
  const [loading, setLoading] = useState(false)
  const labels = dictionaries[getClientLocale()]

  if (!isImpersonating()) return null

  const handleStopImpersonation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/impersonate', {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert(labels.stopError)
      }
    } catch (error) {
      console.error(error)
      alert(labels.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-[100] flex w-full items-center justify-between bg-amber-500 px-4 py-2 text-white shadow-md">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm font-black uppercase tracking-wider">{labels.mode}</span>
          <span className="hidden opacity-50 sm:block">|</span>
          <span className="text-sm">
            {labels.viewingAs} <span className="font-bold">{user?.name}</span> ({user?.email})
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleStopImpersonation}
        className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loading ? labels.processing : labels.stop}
      </button>
    </div>
  )
}
