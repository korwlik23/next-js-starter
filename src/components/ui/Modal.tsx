'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] h-[90vh]',
}

export interface ModalProps {
  is_open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: React.ReactNode
  close_on_overlay?: boolean
  close_on_esc?: boolean
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
  const t = useTranslations('components.modal')
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (close_on_esc && e.key === 'Escape') {
        onClose()
      }
    },
    [close_on_esc, onClose]
  )

  useEffect(() => {
    if (is_open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [is_open, handleKeyDown])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (close_on_overlay && e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!is_open) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={clsx(
          'w-full bg-neutral-950 border border-neutral-800 shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in zoom-in-95 duration-200',
          SIZE_STYLES[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
              aria-label={t('close')}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors z-10"
            aria-label={t('close')}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

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
  title,
  message,
  confirm_text,
  cancel_text,
  is_loading = false,
  variant = 'default',
}: ConfirmModalProps) {
  const t = useTranslations('components.modal')

  return (
    <Modal is_open={is_open} onClose={onClose} title={title ?? t('confirmTitle')} size="sm">
      <p className="text-sm text-neutral-400 mb-6">{message ?? t('confirmMessage')}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          disabled={is_loading}
          className="px-5 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-white hover:border-white transition-colors disabled:opacity-40"
        >
          {cancel_text ?? t('cancel')}
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
          {confirm_text ?? t('confirm')}
        </button>
      </div>
    </Modal>
  )
}
