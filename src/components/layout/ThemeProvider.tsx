'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import * as React from 'react'

// ────────────────────────────────────────
// ThemeProvider — จัดการ dark/light theme
// ────────────────────────────────────────

// ใช้ ComponentProps แบบตรงๆ เพื่อหลีกเลี่ยงปัญหา type conflicts ใน 
// บางเวอร์ชันของ next-themes
export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
