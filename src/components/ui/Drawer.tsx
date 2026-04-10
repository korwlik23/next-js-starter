'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Drawer — แผงเลื่อนเข้าจากด้านข้าง
// รองรับ: ซ้าย/ขวา, ESC ปิด, overlay click ปิด
// ────────────────────────────────────────

type DrawerPosition = 'left' | 'right'
type DrawerSize = 'sm' | 'md' | 'lg'

const SIZE_STYLES: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[32rem]',
}

export interface DrawerProps {
  /** สถานะเปิด/ปิด */
  is_open: boolean
  /** callback เมื่อปิด drawer */
  onClose: () => void
  /** หัวข้อ drawer */
  title?: string
  /** ตำแหน่งการเลื่อน */
  position?: DrawerPosition
  /** ขนาด drawer */
  size?: DrawerSize
  /** เนื้อหาภายใน */
  children: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
}

export function Drawer({
  is_open,
  onClose,
  title,
  position = 'right',
  size = 'md',
  children,
  footer,
}: DrawerProps) {
  const overlay_ref = useRef<HTMLDivElement>(null)

  // จัดการปิด drawer ด้วยปุ่ม ESC
  const HandleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  // ผูก keyboard event และล็อค body scroll
  useEffect(() => {
    if (is_open) {
      document.addEventListener('keydown', HandleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', HandleKeyDown)
      document.body.style.overflow = ''
    }
  }, [is_open, HandleKeyDown])

  // คลิกที่ overlay เพื่อปิด
  const HandleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlay_ref.current) onClose()
  }

  if (!is_open) return null

  return createPortal(
    <div
      ref={overlay_ref}
      onClick={HandleOverlayClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* แผง Drawer */}
      <div
        className={clsx(
          'fixed top-0 h-full bg-neutral-950 border-neutral-800 shadow-2xl flex flex-col',
          SIZE_STYLES[size],
          // ตำแหน่งและ animation ตามด้าน
          position === 'right' && 'right-0 border-l animate-in slide-in-from-right duration-300',
          position === 'left' && 'left-0 border-r animate-in slide-in-from-left duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title ?? ''}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
