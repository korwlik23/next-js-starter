'use client'

// ────────────────────────────────────────
// Radio — Radio button group component
// รองรับ controlled/uncontrolled, horizontal/vertical, keyboard nav
// ────────────────────────────────────────

import { useState, useCallback, type ChangeEvent } from 'react'

/** ตัวเลือกแต่ละตัว */
interface RadioOption {
  /** ค่าที่ส่งกลับ */
  value: string
  /** ข้อความแสดงผล */
  label: string
  /** คำอธิบายเพิ่มเติม */
  description?: string
  /** ปิดการใช้งาน option นี้ */
  is_disabled?: boolean
}

/** Props สำหรับ RadioGroup */
interface RadioGroupProps {
  /** ชื่อ field (ต้องไม่ซ้ำกัน) */
  name: string
  /** รายการตัวเลือก */
  options: RadioOption[]
  /** ค่าที่เลือก (controlled mode) */
  value?: string
  /** ค่าเริ่มต้น (uncontrolled mode) */
  default_value?: string
  /** callback เมื่อเปลี่ยนค่า */
  on_change?: (value: string) => void
  /** label ของ group */
  label?: string
  /** ข้อความ error */
  error?: string
  /** แสดงแบบแนวนอน (default: false = แนวตั้ง) */
  is_horizontal?: boolean
  /** ปิดการใช้งานทั้ง group */
  is_disabled?: boolean
  /** className เพิ่มเติม */
  className?: string
}

/**
 * RadioGroup component — กลุ่มปุ่ม radio สำหรับเลือกตัวเลือกเดียว
 * รองรับ controlled/uncontrolled mode, error state, descriptions
 *
 * @example
 * <RadioGroup
 *   name="plan"
 *   label="เลือกแพลน"
 *   options={[
 *     { value: 'free', label: 'Free', description: 'ใช้ฟรีตลอด' },
 *     { value: 'pro', label: 'Pro', description: '฿590/เดือน' },
 *   ]}
 *   on_change={(val) => console.log(val)}
 * />
 */
export function RadioGroup({
  name,
  options,
  value: controlled_value,
  default_value = '',
  on_change,
  label,
  error,
  is_horizontal = false,
  is_disabled = false,
  className = '',
}: RadioGroupProps) {
  // ── Internal state สำหรับ uncontrolled mode
  const [internal_value, setInternalValue] = useState(default_value)
  const current_value = controlled_value !== undefined ? controlled_value : internal_value

  // ── จัดการการเปลี่ยนค่า
  const HandleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const new_value = e.target.value
      if (controlled_value === undefined) {
        setInternalValue(new_value)
      }
      on_change?.(new_value)
    },
    [controlled_value, on_change]
  )

  return (
    <fieldset
      className={`radio-group ${className}`}
      disabled={is_disabled}
      style={{ border: 'none', padding: 0, margin: 0 }}
    >
      {/* Label ของ group */}
      {label && (
        <legend
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-text-muted, #777)' }}
        >
          {label}
        </legend>
      )}

      {/* Options */}
      <div
        className={is_horizontal ? 'flex flex-wrap gap-4' : 'space-y-2'}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((option) => {
          const is_checked = current_value === option.value
          const is_option_disabled = is_disabled || option.is_disabled

          return (
            <label
              key={option.value}
              className="flex items-start gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: is_checked
                  ? 'var(--color-surface-mid, #f5f5f5)'
                  : 'transparent',
                border: is_checked
                  ? '1px solid var(--color-primary, #1b1b1b)'
                  : '1px solid transparent',
                cursor: is_option_disabled ? 'not-allowed' : 'pointer',
                opacity: is_option_disabled ? 0.5 : 1,
              }}
            >
              {/* Custom radio circle */}
              <span className="mt-0.5 relative flex items-center justify-center shrink-0">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={is_checked}
                  onChange={HandleChange}
                  disabled={is_option_disabled}
                  className="sr-only"
                  aria-describedby={
                    option.description ? `${name}-${option.value}-desc` : undefined
                  }
                />
                {/* Outer circle */}
                <span
                  className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: is_checked
                      ? 'var(--color-primary, #1b1b1b)'
                      : 'var(--color-border-strong, #ccc)',
                  }}
                >
                  {/* Inner dot — แสดงเมื่อเลือก */}
                  {is_checked && (
                    <span
                      className="w-[10px] h-[10px] rounded-full"
                      style={{ backgroundColor: 'var(--color-primary, #1b1b1b)' }}
                    />
                  )}
                </span>
              </span>

              {/* Label + Description */}
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm font-medium block"
                  style={{ color: 'var(--color-text, #1b1b1b)' }}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span
                    id={`${name}-${option.value}-desc`}
                    className="text-xs block mt-0.5"
                    style={{ color: 'var(--color-text-muted, #777)' }}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {/* Error message */}
      {error && (
        <p
          className="text-xs mt-2 flex items-center gap-1"
          style={{ color: 'var(--color-danger, #e74c3c)' }}
          role="alert"
        >
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </fieldset>
  )
}
