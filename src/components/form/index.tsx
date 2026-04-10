import { forwardRef } from 'react'
import { clsx } from 'clsx'

// ────────────────────────────────────────
// FormField wrapper
// ────────────────────────────────────────
interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-neutral-600">{hint}</p>}
    </div>
  )
}

// ────────────────────────────────────────
// Select
// ────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <FormField label={label} error={error}>
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'editorial-input w-full appearance-none cursor-pointer',
            'bg-transparent',
            error && 'border-b-red-500',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-neutral-900">
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    )
  }
)
Select.displayName = 'Select'

// ────────────────────────────────────────
// Textarea
// ────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, rows = 4, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <FormField label={label} error={error}>
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          className={clsx(
            'editorial-input w-full resize-none',
            error && 'border-b-red-500',
            className
          )}
          {...props}
        />
      </FormField>
    )
  }
)
Textarea.displayName = 'Textarea'
