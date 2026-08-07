'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

type DrawerPosition = 'left' | 'right'
type DrawerSize = 'sm' | 'md' | 'lg'

const SIZE_STYLES: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[32rem]',
}

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface DrawerProps {
  /** Open/closed state. */
  is_open: boolean
  /** Called when the drawer should close. */
  onClose: () => void
  /** Drawer heading. */
  title?: string
  /** Side from which the drawer enters. */
  position?: DrawerPosition
  /** Drawer width. */
  size?: DrawerSize
  /** Accessible label used when no title is rendered. */
  aria_label?: string
  /** Accessible label for the close button. */
  close_label?: string
  /** Drawer content. */
  children: React.ReactNode
  /** Optional footer content. */
  footer?: React.ReactNode
}

export function Drawer({
  is_open,
  onClose,
  title,
  position = 'right',
  size = 'md',
  aria_label,
  close_label,
  children,
  footer,
}: DrawerProps) {
  const overlay_ref = useRef<HTMLDivElement>(null)
  const panel_ref = useRef<HTMLDivElement>(null)
  const opener_ref = useRef<HTMLElement | null>(null)
  const on_close_ref = useRef(onClose)
  const title_id = useId()

  useEffect(() => {
    on_close_ref.current = onClose
  }, [onClose])

  const HandleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      on_close_ref.current()
    }
  }, [])

  const HandlePanelKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return

    const items = Array.from(
      panel_ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
    )

    if (!items.length) return

    const first = items[0]
    const last = items[items.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!is_open) return

    const previous_focus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previous_overflow = document.body.style.overflow
    opener_ref.current = previous_focus
    document.body.style.overflow = 'hidden'

    const first = panel_ref.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    first?.focus()
    document.addEventListener('keydown', HandleKeyDown)

    return () => {
      document.removeEventListener('keydown', HandleKeyDown)
      document.body.style.overflow = previous_overflow

      const opener = opener_ref.current
      opener_ref.current = null
      opener?.focus()
    }
  }, [HandleKeyDown, is_open])

  const HandleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlay_ref.current) onClose()
  }

  if (!is_open) return null

  return createPortal(
    <div
      ref={overlay_ref}
      onClick={HandleOverlayClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      aria-hidden={!is_open}
      data-ui-component="drawer"
    >
      <div
        ref={panel_ref}
        className={clsx(
          'absolute inset-y-0 flex h-full flex-col bg-neutral-950 shadow-2xl border-neutral-800',
          SIZE_STYLES[size],
          position === 'right' && 'right-0 border-l animate-in slide-in-from-right duration-300',
          position === 'left' && 'left-0 border-r animate-in slide-in-from-left duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? title_id : undefined}
        aria-label={title ? undefined : aria_label}
        onKeyDown={HandlePanelKeyDown}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          {title && (
            <h2 id={title_id} className="text-sm font-bold uppercase tracking-widest text-white">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={close_label ?? title}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

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
