// ────────────────────────────────────────
// useTheme — hook สำหรับจัดการ theme
// Wrapper รอบ next-themes เพื่อให้คง API ไว้
// ────────────────────────────────────────

import { useTheme as useNextTheme } from 'next-themes'

export function UseTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme()

  const current_theme = theme === 'system' ? systemTheme : theme

  const is_dark = current_theme === 'dark'
  const is_light = current_theme === 'light'

  const toggle_theme = () => {
    setTheme(is_dark ? 'light' : 'dark')
  }

  return {
    theme: current_theme as 'dark' | 'light',
    is_dark,
    is_light,
    toggle_theme,
    set_theme: (val: 'dark' | 'light') => setTheme(val),
  }
}
