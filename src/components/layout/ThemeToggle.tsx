'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // ป้องกัน Hydration Mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button 
        className="transition-colors w-8 h-8 flex items-center justify-center opacity-50" 
        style={{ color: 'var(--color-text-subtle)' }}
        aria-label="Toggle Theme"
      >
        <span className="material-symbols-outlined text-[1.2rem]">light_mode</span>
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={clsx(
        "transition-colors hover:opacity-70 flex items-center justify-center w-8 h-8 rounded-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      style={{ color: 'var(--color-text-subtle)' }}
      aria-label="Toggle Theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="material-symbols-outlined text-[1.2rem]">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
