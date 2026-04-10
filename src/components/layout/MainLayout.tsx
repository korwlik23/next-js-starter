'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

// ────────────────────────────────────────
// Main Layout Client Wrapper
// ครอบหน้า dashboard, settings, profile, module
// มี Sidebar ซ้าย, TopNav ด้านบน + ErrorBoundary
// ────────────────────────────────────────

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sidebar — แถบนำทางด้านซ้าย */}
      <Sidebar />

      {/* TopNav — แถบด้านบน */}
      <TopNav />

      {/* เนื้อหาหลัก — เลื่อนจาก sidebar + topnav */}
      <main
        className="pt-16 min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <div className="p-8 lg:p-12">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
