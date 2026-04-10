// ────────────────────────────────────────
// Skeleton — Loading placeholder component
// แสดง shimmer animation ขณะรอโหลดข้อมูล
// ────────────────────────────────────────

import { type CSSProperties } from 'react'

/** Props สำหรับ Skeleton component */
interface SkeletonProps {
  /** ความกว้าง (default: '100%') */
  width?: string | number
  /** ความสูง (default: '1rem') */
  height?: string | number
  /** border-radius (default: '0.25rem') */
  border_radius?: string
  /** แสดงเป็นวงกลม */
  is_circle?: boolean
  /** จำนวนแถวที่แสดง (สำหรับ text skeleton) */
  lines?: number
  /** className เพิ่มเติม */
  className?: string
}

/**
 * Skeleton component — แสดง placeholder ขณะโหลดข้อมูล
 * รองรับทั้งรูปแบบ rectangle, circle, และ multi-line text
 *
 * @example
 * // Rectangle skeleton
 * <Skeleton width="200px" height="1rem" />
 *
 * // Circle skeleton (avatar)
 * <Skeleton is_circle width={48} height={48} />
 *
 * // Multi-line text skeleton
 * <Skeleton lines={3} />
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  border_radius = '0.25rem',
  is_circle = false,
  lines,
  className = '',
}: SkeletonProps) {
  // ── สร้าง style พื้นฐาน
  const base_style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: is_circle ? '50%' : border_radius,
    backgroundColor: 'var(--color-surface-high, #e5e5e5)',
    backgroundImage:
      'linear-gradient(90deg, var(--color-surface-high, #e5e5e5) 25%, var(--color-surface-mid, #d4d4d4) 50%, var(--color-surface-high, #e5e5e5) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
  }

  // ── Multi-line mode — แสดงหลายแถว
  if (lines && lines > 1) {
    return (
      <div className={`skeleton-lines ${className}`} role="status" aria-label="กำลังโหลดเนื้อหา">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            style={{
              ...base_style,
              // แถวสุดท้ายสั้นลง 30% เพื่อให้ดูเป็นธรรมชาติ
              width: idx === lines - 1 ? '70%' : '100%',
              marginBottom: idx < lines - 1 ? '0.5rem' : 0,
            }}
          />
        ))}
      </div>
    )
  }

  // ── Single skeleton element
  return (
    <div
      className={`skeleton ${className}`}
      style={base_style}
      role="status"
      aria-label="กำลังโหลดเนื้อหา"
    />
  )
}

/**
 * SkeletonCard — Skeleton สำหรับ card layout
 * แสดง placeholder ของ card content (avatar + title + description)
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-6 rounded-lg ${className}`}
      style={{
        backgroundColor: 'var(--color-surface, #fafafa)',
        border: '1px solid var(--color-border, #e5e5e5)',
      }}
      role="status"
      aria-label="กำลังโหลดข้อมูล"
    >
      {/* Avatar + Title row */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton is_circle width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height="0.875rem" />
          <div style={{ marginTop: '0.375rem' }}>
            <Skeleton width="40%" height="0.625rem" />
          </div>
        </div>
      </div>
      {/* Description lines */}
      <Skeleton lines={3} height="0.75rem" />
    </div>
  )
}
