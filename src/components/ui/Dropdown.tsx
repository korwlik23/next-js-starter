'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Dropdown — เมนูแบบ popup
// รองรับ: click outside ปิด, keyboard navigation, divider, danger items
// ────────────────────────────────────────

export interface DropdownItem {
  /** ข้อความแสดง */
  label: string
  /** callback เมื่อคลิก */
  onClick?: () => void
  /** ไอคอน Material Symbol */
  icon?: string
  /** ปิดใช้งาน */
  disabled?: boolean
  /** สีแดงสำหรับ action อันตราย */
  is_danger?: boolean
  /** เป็น divider แทนที่จะเป็น item */
  is_divider?: boolean
}

interface DropdownProps {
  /** ปุ่ม trigger สำหรับเปิด dropdown */
  trigger: React.ReactNode
  /** รายการ items */
  items: DropdownItem[]
  /** ตำแหน่งแสดง */
  align?: 'left' | 'right'
  /** ความกว้าง */
  width?: string
  /** CSS class เพิ่มเติม */
  className?: string
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 'w-48',
  className,
}: DropdownProps) {
  const [is_open, setIsOpen] = useState(false)
  const [focused_index, setFocusedIndex] = useState(-1)
  const container_ref = useRef<HTMLDivElement>(null)
  const menu_ref = useRef<HTMLDivElement>(null)

  // กรอง items ที่ไม่ใช่ divider สำหรับ keyboard navigation
  const actionable_items = items.filter((item) => !item.is_divider && !item.disabled)

  // ปิด dropdown เมื่อคลิกข้างนอก
  const HandleClickOutside = useCallback((e: MouseEvent) => {
    if (container_ref.current && !container_ref.current.contains(e.target as Node)) {
      setIsOpen(false)
      setFocusedIndex(-1)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', HandleClickOutside)
    return () => document.removeEventListener('mousedown', HandleClickOutside)
  }, [HandleClickOutside])

  // จัดการ keyboard navigation
  const HandleKeyDown = (e: React.KeyboardEvent) => {
    if (!is_open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < actionable_items.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : actionable_items.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (focused_index >= 0) {
          actionable_items[focused_index]?.onClick?.()
          setIsOpen(false)
          setFocusedIndex(-1)
        }
        break
    }
  }

  // คลิกเลือก item
  const HandleItemClick = (item: DropdownItem) => {
    if (item.disabled) return
    item.onClick?.()
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  return (
    <div
      ref={container_ref}
      className={clsx('relative inline-block', className)}
      onKeyDown={HandleKeyDown}
    >
      {/* ปุ่ม Trigger */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer"
        role="button"
        aria-haspopup="menu"
        aria-expanded={is_open}
        tabIndex={0}
      >
        {trigger}
      </div>

      {/* เมนู Dropdown */}
      {is_open && (
        <div
          ref={menu_ref}
          role="menu"
          className={clsx(
            'absolute z-50 mt-1 py-1',
            'bg-neutral-950 border border-neutral-800 shadow-xl',
            'animate-in fade-in zoom-in-95 duration-150',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => {
            // แสดง divider
            if (item.is_divider) {
              return (
                <div key={`divider-${idx}`} className="h-px bg-neutral-800 my-1" role="separator" />
              )
            }

            // หา index ของ item ใน actionable_items เพื่อเช็ค focus
            const actionable_idx = actionable_items.indexOf(item)

            return (
              <button
                key={idx}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => HandleItemClick(item)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                  item.disabled && 'opacity-30 cursor-not-allowed',
                  item.is_danger
                    ? 'text-red-400 hover:bg-red-950/50'
                    : 'text-neutral-300 hover:bg-neutral-900',
                  actionable_idx === focused_index && 'bg-neutral-900'
                )}
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                )}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
