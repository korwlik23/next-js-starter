'use client'

import { useState, useRef } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Tooltip — แสดงข้อความเมื่อ hover
// รองรับ: 4 ตำแหน่ง, delay, CSS animation
// ────────────────────────────────────────

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

const POSITION_STYLES: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

/** Arrow styles สำหรับแต่ละตำแหน่ง */
const ARROW_STYLES: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-800 border-x-transparent border-b-transparent border-4',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800 border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-800 border-y-transparent border-r-transparent border-4',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-neutral-800 border-y-transparent border-l-transparent border-4',
}

interface TooltipProps {
  /** ข้อความหรือเนื้อหาใน tooltip */
  content: React.ReactNode
  /** ตำแหน่งแสดง tooltip */
  position?: TooltipPosition
  /** หน่วงเวลาก่อนแสดง (ms) */
  delay?: number
  /** Element ที่ต้อง hover */
  children: React.ReactNode
  /** CSS class เพิ่มเติม */
  className?: string
}

export function Tooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  className,
}: TooltipProps) {
  const [is_visible, setIsVisible] = useState(false)
  const timeout_ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  // แสดง tooltip หลังหน่วงเวลา
  const HandleMouseEnter = () => {
    timeout_ref.current = setTimeout(() => setIsVisible(true), delay)
  }

  // ซ่อน tooltip ทันที
  const HandleMouseLeave = () => {
    if (timeout_ref.current) clearTimeout(timeout_ref.current)
    setIsVisible(false)
  }

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={HandleMouseEnter}
      onMouseLeave={HandleMouseLeave}
      onFocus={HandleMouseEnter}
      onBlur={HandleMouseLeave}
    >
      {children}
      {is_visible && (
        <div
          role="tooltip"
          className={clsx(
            'absolute z-50 whitespace-nowrap pointer-events-none',
            'px-2.5 py-1.5 text-xs text-neutral-200 bg-neutral-800 border border-neutral-700',
            'animate-in fade-in zoom-in-95 duration-150',
            POSITION_STYLES[position]
          )}
        >
          {content}
          {/* ลูกศรชี้ไปยัง target */}
          <div className={clsx('absolute w-0 h-0', ARROW_STYLES[position])} />
        </div>
      )}
    </div>
  )
}
