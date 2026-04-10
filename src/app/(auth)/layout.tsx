import type { Metadata } from 'next'
import Link from 'next/link'

// ────────────────────────────────────────
// Auth Layout — ครอบหน้า login, register, forgot-password
// ใช้เป็น nested layout (ไม่สร้าง html/body ซ้ำ)
// robots: noindex — ไม่ต้องการให้ Google index หน้า auth
// ────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: '%s — Next.js Starter',
    default: 'Sign In — Next.js Starter',
  },
  description: 'Sign in to your account to access the dashboard and manage your workspace.',
  // ไม่ให้ Search Engine index หน้า auth (ข้อมูล sensitive + ไม่มีประโยชน์ต่อ SEO)
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  openGraph: {
    title: 'Sign In — Next.js Starter',
    description: 'Sign in to your account',
    type: 'website',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Wrapper สำหรับ auth pages — full screen centered */
    <div className="relative min-h-screen flex items-center justify-center p-6 sm:p-12">
      {/* เนื้อหาหลัก (form) */}
      {children}

      {/* Decorative grid panel — แถบขวา เพิ่มมิติให้หน้า */}
      <div
        className="fixed top-0 right-0 w-1/3 h-full hidden lg:block -z-10"
        style={{ backgroundColor: 'var(--color-surface-mid)' }}
      >
        {/* รูปแบบ dot-grid เพื่อความ editorial */}
        <div
          className="h-full w-full pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Editorial accent — ข้อความแนวตั้งมุมล่างซ้าย */}
      <div className="fixed bottom-12 left-12 hidden lg:block">
        <div className="flex flex-col gap-4">
          {/* เส้นแนวตั้ง decorative */}
          <div
            className="w-px h-16"
            style={{ backgroundColor: 'var(--color-border-strong)' }}
          />
          <span
            className="text-[10px] tracking-[0.2em] font-bold uppercase"
            style={{
              color: 'var(--color-text-faint)',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            EDITION MMXXVI
          </span>
        </div>
      </div>
    </div>
  )
}
