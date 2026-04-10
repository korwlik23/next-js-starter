'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Modal — คอมโพเนนต์ dialog แบบ overlay
// รองรับ: ESC ปิด, click overlay ปิด, animation, portal render
// ────────────────────────────────────────

/** ขนาดของ Modal */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] h-[90vh]',
}

export interface ModalProps {
  /** สถานะเปิด/ปิด */
  is_open: boolean
  /** callback เมื่อปิด modal */
  onClose: () => void
  /** หัวข้อ modal */
  title?: string
  /** ขนาด modal */
  size?: ModalSize
  /** เนื้อหาภายใน */
  children: React.ReactNode
  /** ปิด modal เมื่อคลิก overlay */
  close_on_overlay?: boolean
  /** ปิด modal เมื่อกด ESC */
  close_on_esc?: boolean
  /** Footer content */
  footer?: React.ReactNode
}

export function Modal({
  is_open,
  onClose,
  title,
  size = 'md',
  children,
  close_on_overlay = true,
  close_on_esc = true,
  footer,
}: ModalProps) {
  const overlay_ref = useRef<HTMLDivElement>(null)

  // จัดการปิด modal ด้วยปุ่ม ESC
  const HandleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (close_on_esc && e.key === 'Escape') {
        onClose()
      }
    },
    [close_on_esc, onClose]
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
    if (close_on_overlay && e.target === overlay_ref.current) {
      onClose()
    }
  }

  // ไม่แสดงผลถ้าปิดอยู่
  if (!is_open) return null

  // ใช้ portal เพื่อ render นอก DOM tree หลัก
  return createPortal(
    <div
      ref={overlay_ref}
      onClick={HandleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* กล่อง modal */}
      <div
        className={clsx(
          'w-full bg-neutral-950 border border-neutral-800 shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in zoom-in-95 duration-200',
          SIZE_STYLES[size]
        )}
      >
        {/* Header — แสดงเฉพาะเมื่อมี title */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ปุ่มปิดมุมขวา (กรณีไม่มี title) */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ────────────────────────────────────────
// ConfirmModal — Modal ยืนยันการกระทำ
// ────────────────────────────────────────
interface ConfirmModalProps {
  is_open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirm_text?: string
  cancel_text?: string
  is_loading?: boolean
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  is_open,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message = 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการนี้?',
  confirm_text = 'ยืนยัน',
  cancel_text = 'ยกเลิก',
  is_loading = false,
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <Modal is_open={is_open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-neutral-400 mb-6">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          disabled={is_loading}
          className="px-5 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-white hover:border-white transition-colors disabled:opacity-40"
        >
          {cancel_text}
        </button>
        <button
          onClick={onConfirm}
          disabled={is_loading}
          className={clsx(
            'px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40',
            variant === 'danger'
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-white text-black hover:bg-neutral-200'
          )}
        >
          {is_loading && (
            <span className="material-symbols-outlined animate-spin text-sm mr-1 align-middle">
              progress_activity
            </span>
          )}
          {confirm_text}
        </button>
      </div>
    </Modal>
  )
}
