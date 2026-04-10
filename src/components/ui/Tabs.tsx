'use client'

import { useState, useCallback } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Tabs — คอมโพเนนต์แท็บสลับเนื้อหา
// รองรับ: controlled mode, keyboard navigation, accessible
// ────────────────────────────────────────

export interface TabItem {
  /** ค่า key ของแท็บ */
  value: string
  /** ข้อความแสดง */
  label: string
  /** ไอคอน Material Symbol */
  icon?: string
  /** ปิดใช้งาน */
  disabled?: boolean
  /** เนื้อหาของแท็บ */
  content: React.ReactNode
}

interface TabsProps {
  /** รายการแท็บทั้งหมด */
  items: TabItem[]
  /** แท็บที่เลือกอยู่ (controlled mode) */
  active_tab?: string
  /** callback เมื่อเปลี่ยนแท็บ */
  onTabChange?: (value: string) => void
  /** Default tab ถ้าไม่ controlled */
  default_tab?: string
  /** CSS class เพิ่มเติม */
  className?: string
}

export function Tabs({ items, active_tab, onTabChange, default_tab, className }: TabsProps) {
  // ใช้ state ภายในถ้าไม่ได้ controlled จากภายนอก
  const [internal_tab, setInternalTab] = useState(default_tab ?? items[0]?.value ?? '')

  const current_tab = active_tab ?? internal_tab

  const HandleTabClick = useCallback(
    (value: string) => {
      setInternalTab(value)
      onTabChange?.(value)
    },
    [onTabChange]
  )

  // จัดการ keyboard navigation ระหว่างแท็บ
  const HandleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const enabled_items = items.filter((item) => !item.disabled)
    const current_enabled_idx = enabled_items.findIndex((item) => item.value === items[idx]?.value)

    let target_idx = -1
    if (e.key === 'ArrowRight') {
      target_idx = current_enabled_idx < enabled_items.length - 1 ? current_enabled_idx + 1 : 0
    } else if (e.key === 'ArrowLeft') {
      target_idx = current_enabled_idx > 0 ? current_enabled_idx - 1 : enabled_items.length - 1
    }

    if (target_idx >= 0) {
      e.preventDefault()
      const target_item = enabled_items[target_idx]
      if (target_item) HandleTabClick(target_item.value)
    }
  }

  // หาเนื้อหาของแท็บที่เลือก
  const active_content = items.find((item) => item.value === current_tab)?.content

  return (
    <div className={className}>
      {/* Tab List */}
      <div role="tablist" className="flex border-b border-neutral-800 overflow-x-auto">
        {items.map((item, idx) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={current_tab === item.value}
            aria-controls={`panel-${item.value}`}
            tabIndex={current_tab === item.value ? 0 : -1}
            disabled={item.disabled}
            onClick={() => HandleTabClick(item.value)}
            onKeyDown={(e) => HandleKeyDown(e, idx)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap',
              'transition-all duration-200 border-b-2 -mb-px',
              current_tab === item.value
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700',
              item.disabled && 'opacity-30 cursor-not-allowed'
            )}
          >
            {item.icon && <span className="material-symbols-outlined text-sm">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Panel — แสดงเนื้อหาแท็บที่เลือก */}
      <div role="tabpanel" id={`panel-${current_tab}`} className="py-5">
        {active_content}
      </div>
    </div>
  )
}
