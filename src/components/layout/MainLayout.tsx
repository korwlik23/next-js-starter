'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

// ────────────────────────────────────────
// Main Layout Client Wrapper
// ครอบหน้า dashboard, settings, profile, module
// มี Sidebar ซ้าย, TopNav ด้านบน + ErrorBoundary
// ────────────────────────────────────────

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] lg:grid lg:grid-cols-[var(--sidebar-width)_1fr]"
      style={{ isolation: 'isolate' }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col min-w-0 min-h-screen">
        {/* TopNav */}
        <TopNav onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
