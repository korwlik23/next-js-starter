import type { Metadata } from 'next'
import MainLayoutClient from '@/components/layout/MainLayout'

// ────────────────────────────────────────
// Main Layout — ครอบหน้า dashboard, settings, profile, module
// ใช้เป็น nested layout (ไม่สร้าง html/body ซ้ำ)
// มี Sidebar ซ้ายและ TopNav ด้านบน + ErrorBoundary
// ────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: '%s — Next.js Starter',
    default: 'Dashboard',
  },
  description: 'Ultimate Next.js Starter Template',
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainLayoutClient>{children}</MainLayoutClient>
}
