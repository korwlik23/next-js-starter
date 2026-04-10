import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// ─────────────────────────────────────────
// Lazy Load Utility — โหลด component แบบ dynamic
// ลด initial bundle size + ปรับปรุง Core Web Vitals
// ─────────────────────────────────────────

/**
 * สร้าง lazy-loaded component ด้วย next/dynamic
 * - รองรับ loading placeholder
 * - รองรับ SSR toggle
 *
 * @example
 * // โหลด component แบบ lazy (ไม่ SSR)
 * const HeavyChart = LazyLoad(() => import('@/components/HeavyChart'))
 *
 * // โหลดแบบ lazy พร้อม custom loading
 * const DataMap = LazyLoad(
 *   () => import('@/components/DataMap'),
 *   { loading_text: 'กำลังโหลดแผนที่...' }
 * )
 *
 * // โหลดแบบ lazy พร้อม SSR
 * const SEOContent = LazyLoad(
 *   () => import('@/components/SEOContent'),
 *   { is_ssr: true }
 * )
 */

interface LazyLoadOptions {
  /** ข้อความแสดงขณะโหลด */
  loading_text?: string
  /** เปิด/ปิด SSR (default: false — ไม่ render ฝั่ง server) */
  is_ssr?: boolean
}

export function LazyLoad<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): T {
  const { loading_text = 'กำลังโหลด...', is_ssr = false } = options

  return dynamic(loader, {
    loading: () => (
      <div
        className="lazy-load-placeholder"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'var(--color-text-secondary, #888)',
          fontSize: '0.875rem',
        }}
        role="status"
        aria-label={loading_text}
      >
        <span>{loading_text}</span>
      </div>
    ),
    ssr: is_ssr,
  }) as unknown as T
}

/**
 * สร้าง lazy-loaded component พร้อม skeleton loading
 * เหมาะสำหรับ component ที่มีขนาดใหญ่และต้องการ UX ที่ดี
 *
 * @example
 * const Dashboard = LazyLoadWithSkeleton(
 *   () => import('@/components/Dashboard'),
 *   { width: '100%', height: '400px' }
 * )
 */

interface SkeletonOptions {
  /** ความกว้างของ skeleton (default: '100%') */
  width?: string
  /** ความสูงของ skeleton (default: '200px') */
  height?: string
  /** border-radius ของ skeleton (default: '8px') */
  border_radius?: string
  /** เปิด/ปิด SSR (default: false) */
  is_ssr?: boolean
}

export function LazyLoadWithSkeleton<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options: SkeletonOptions = {}
): T {
  const { width = '100%', height = '200px', border_radius = '8px', is_ssr = false } = options

  return dynamic(loader, {
    loading: () => (
      <div
        className="lazy-load-skeleton"
        style={{
          width,
          height,
          borderRadius: border_radius,
          background:
            'linear-gradient(90deg, var(--color-surface-2, #f0f0f0) 25%, var(--color-surface-3, #e0e0e0) 50%, var(--color-surface-2, #f0f0f0) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
        role="status"
        aria-label="กำลังโหลดเนื้อหา"
      />
    ),
    ssr: is_ssr,
  }) as unknown as T
}
