'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'

// ────────────────────────────────────────
// FeatureGate — Component wrapper สำหรับ plan-based gating
// ซ่อน/แสดง UI ตาม plan ของ tenant
// ────────────────────────────────────────

interface FeatureGateProps {
  /** plan ปัจจุบันของ tenant */
  plan: string
  /** feature ที่ต้องการตรวจสอบ */
  feature: string
  /** เนื้อหาที่แสดงเมื่อมีสิทธิ์ */
  children: ReactNode
  /** เนื้อหาที่แสดงเมื่อไม่มีสิทธิ์ (ถ้าไม่ระบุจะแสดง upgrade prompt) */
  fallback?: ReactNode
}

// Import dynamically เพื่อหลีกเลี่ยงปัญหา server/client
import { CanAccessFeature, type FeatureKey } from '@/lib/feature-gate'

export function FeatureGate({ plan, feature, children, fallback }: FeatureGateProps) {
  // ตรวจสอบสิทธิ์
  const has_access = CanAccessFeature(plan, feature as FeatureKey)

  if (has_access) {
    return <>{children}</>
  }

  // ถ้ามี custom fallback ให้ใช้
  if (fallback) {
    return <>{fallback}</>
  }

  // Default upgrade prompt — แสดงเมื่อ feature ถูกจำกัด
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg text-center"
      style={{
        backgroundColor: 'var(--color-surface-mid)',
        border: '1px dashed var(--color-border)',
      }}
    >
      <span
        className="material-symbols-outlined text-3xl"
        style={{ color: 'var(--color-warning, #e67e22)' }}
      >
        lock
      </span>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        ฟีเจอร์นี้ไม่พร้อมใช้งานสำหรับแพลน {plan.toUpperCase()}
      </p>
      <Link
        href="/billing"
        className="btn-primary text-sm"
      >
        อัปเกรดแพลน
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </Link>
    </div>
  )
}
