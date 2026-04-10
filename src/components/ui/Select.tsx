import { forwardRef } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// Select — คอมโพเนนต์สำหรับตัวเลือกจากรายการ
// ────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** ข้อความแสดงกำกับ input */
  label?: string
  /** ข้อความแสดง error */
  error?: string
  /** คำอธิบายเพิ่มเติม */
  description?: string
  /** รายการตัวเลือก */
  options?: { label: string; value: string | number }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, description, className, id, disabled, options, children, ...props }, ref) => {
    const input_id = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={input_id}
            className={clsx(
              'label-sm uppercase tracking-wider',
              disabled ? 'text-neutral-600' : 'text-neutral-400',
              error && 'text-red-400'
            )}
          >
            {label}
          </label>
        )}

        {/* Select field */}
        <div className="relative">
          <select
            ref={ref}
            id={input_id}
            disabled={disabled}
            className={clsx(
              'w-full appearance-none rounded-none border-b bg-transparent px-0 py-2.5 text-base outline-none transition-all duration-200',
              'pr-8 cursor-pointer', // เว้นที่ให้ลูกศร
              error
                ? 'border-red-500 text-red-500 focus:border-red-400'
                : 'border-neutral-800 focus:border-white text-neutral-200 hover:border-neutral-600',
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-black text-white">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          {/* Custom Arrow Icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-500">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* Description & Error */}
        {description && !error && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
