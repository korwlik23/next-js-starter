'use client'

// ────────────────────────────────────────
// Accordion — Collapsible content sections
// รองรับ single/multi expand, animation, keyboard nav
// ────────────────────────────────────────

import { useState, useCallback, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react'

/** Props สำหรับแต่ละ item ใน Accordion */
interface AccordionItem {
  /** ID ที่ไม่ซ้ำกัน */
  id: string
  /** หัวข้อ */
  title: string
  /** เนื้อหาภายใน */
  content: ReactNode
  /** ไอคอนด้านซ้าย (optional) */
  icon?: string
  /** ปิดการใช้งาน item นี้ */
  is_disabled?: boolean
}

/** Props สำหรับ Accordion component */
interface AccordionProps {
  /** รายการ items ทั้งหมด */
  items: AccordionItem[]
  /** อนุญาตให้เปิดหลาย item พร้อมกัน (default: false) */
  allow_multiple?: boolean
  /** ID ของ items ที่เปิดเริ่มต้น */
  default_open?: string[]
  /** className เพิ่มเติม */
  className?: string
}

/**
 * Accordion component — แสดงเนื้อหาแบบพับเก็บได้
 * รองรับ single mode (เปิดได้ทีละ 1) หรือ multi mode (เปิดได้หลายอัน)
 * มี smooth animation + keyboard navigation (ArrowUp/Down, Enter/Space)
 *
 * @example
 * <Accordion items={[
 *   { id: '1', title: 'คำถามที่ 1', content: <p>คำตอบ...</p> },
 *   { id: '2', title: 'คำถามที่ 2', content: <p>คำตอบ...</p> },
 * ]} />
 */
export function Accordion({
  items,
  allow_multiple = false,
  default_open = [],
  className = '',
}: AccordionProps) {
  // ── State: เก็บ ID ของ items ที่เปิดอยู่
  const [open_items, setOpenItems] = useState<Set<string>>(new Set(default_open))
  const trigger_refs = useRef<(HTMLButtonElement | null)[]>([])

  // ── Toggle item เปิด/ปิด
  const HandleToggle = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          // ปิด item
          next.delete(id)
        } else {
          if (!allow_multiple) {
            // Single mode — ปิดทุก item ก่อน
            next.clear()
          }
          next.add(id)
        }
        return next
      })
    },
    [allow_multiple]
  )

  // ── Keyboard navigation (ArrowUp, ArrowDown, Home, End)
  const HandleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const enabled_indices = items
        .map((item, i) => (!item.is_disabled ? i : -1))
        .filter((i) => i !== -1)
      const current_pos = enabled_indices.indexOf(index)

      let target_index: number | null = null

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          target_index = enabled_indices[(current_pos + 1) % enabled_indices.length]
          break
        case 'ArrowUp':
          e.preventDefault()
          target_index =
            enabled_indices[(current_pos - 1 + enabled_indices.length) % enabled_indices.length]
          break
        case 'Home':
          e.preventDefault()
          target_index = enabled_indices[0]
          break
        case 'End':
          e.preventDefault()
          target_index = enabled_indices[enabled_indices.length - 1]
          break
      }

      if (target_index !== null) {
        trigger_refs.current[target_index]?.focus()
      }
    },
    [items]
  )

  return (
    <div className={`accordion ${className}`} role="presentation">
      {items.map((item, index) => {
        const is_open = open_items.has(item.id)

        return (
          <AccordionSection
            key={item.id}
            item={item}
            is_open={is_open}
            on_toggle={() => HandleToggle(item.id)}
            on_key_down={(e) => HandleKeyDown(e, index)}
            ref_callback={(el) => {
              trigger_refs.current[index] = el
            }}
          />
        )
      })}
    </div>
  )
}

// ── AccordionSection — แต่ละ section ที่พับได้
interface AccordionSectionProps {
  item: AccordionItem
  is_open: boolean
  on_toggle: () => void
  on_key_down: (e: KeyboardEvent<HTMLButtonElement>) => void
  ref_callback: (el: HTMLButtonElement | null) => void
}

function AccordionSection({
  item,
  is_open,
  on_toggle,
  on_key_down,
  ref_callback,
}: AccordionSectionProps) {
  const content_ref = useRef<HTMLDivElement>(null)
  const [content_height, setContentHeight] = useState(0)

  // ── วัดความสูงของเนื้อหาเมื่อเปิด/ปิด
  useEffect(() => {
    if (content_ref.current) {
      setContentHeight(is_open ? content_ref.current.scrollHeight : 0)
    }
  }, [is_open])

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-border, #e5e5e5)',
      }}
    >
      {/* ── Trigger button */}
      <button
        ref={ref_callback}
        onClick={on_toggle}
        onKeyDown={on_key_down}
        disabled={item.is_disabled}
        aria-expanded={is_open}
        aria-controls={`accordion-content-${item.id}`}
        id={`accordion-trigger-${item.id}`}
        className="w-full flex items-center justify-between py-4 px-2 text-left transition-colors"
        style={{
          color: item.is_disabled
            ? 'var(--color-text-faint, #aaa)'
            : 'var(--color-text, #1b1b1b)',
          cursor: item.is_disabled ? 'not-allowed' : 'pointer',
          opacity: item.is_disabled ? 0.5 : 1,
        }}
      >
        <span className="flex items-center gap-3">
          {item.icon && (
            <span
              className="material-symbols-outlined text-base"
              style={{ color: 'var(--color-text-muted, #777)' }}
            >
              {item.icon}
            </span>
          )}
          <span className="text-sm font-semibold">{item.title}</span>
        </span>
        {/* ── Chevron icon — หมุน 180° เมื่อเปิด */}
        <span
          className="material-symbols-outlined text-base transition-transform duration-200"
          style={{
            color: 'var(--color-text-faint, #aaa)',
            transform: is_open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>

      {/* ── Content panel — ใช้ max-height animation */}
      <div
        id={`accordion-content-${item.id}`}
        role="region"
        aria-labelledby={`accordion-trigger-${item.id}`}
        style={{
          maxHeight: `${content_height}px`,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease-in-out',
        }}
      >
        <div ref={content_ref} className="pb-4 px-2">
          <div className="text-sm" style={{ color: 'var(--color-text-muted, #555)' }}>
            {item.content}
          </div>
        </div>
      </div>
    </div>
  )
}
