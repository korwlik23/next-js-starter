'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Checkbox — คอมโพเนนต์สำหรับเลือกค่าแบบ boolean
// ────────────────────────────────────────
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** ข้อความแสดงกำกับ checkbox */
  label?: string
  /** ข้อความแสดง error */
  error?: string
  /** คำอธิบายเพิ่มเติม */
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className, id, disabled, ...props }, ref) => {
    const input_id = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={clsx('flex items-start gap-3 group', className)}>
        {/* ช่อง checkbox */}
        <input
          ref={ref}
          id={input_id}
          type="checkbox"
          disabled={disabled}
          className={clsx(
            'mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-sm border cursor-pointer',
            'transition-all duration-150',
            'checked:bg-white checked:border-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black',
            error ? 'border-red-500' : 'border-neutral-600 hover:border-neutral-400',
            disabled && 'opacity-40 cursor-not-allowed',
            // สร้าง checkmark ด้วย CSS pseudo-element
            'relative after:content-[""] after:absolute after:inset-0 after:flex after:items-center after:justify-center',
            'checked:after:bg-[url("data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22black%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E")]',
            'checked:after:bg-center checked:after:bg-no-repeat checked:after:bg-contain'
          )}
          {...props}
        />
        {/* ป้ายกำกับและคำอธิบาย */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={input_id}
                className={clsx(
                  'text-sm cursor-pointer select-none',
                  disabled ? 'text-neutral-600' : 'text-neutral-300',
                  error && 'text-red-400'
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-xs text-neutral-600 mt-0.5">{description}</p>}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

