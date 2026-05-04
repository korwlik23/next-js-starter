import { forwardRef, useId } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: string // material symbol name
  rightIcon?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const reactId = useId()
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `input-${reactId}`)
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block label-xs text-neutral-500 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={clsx(
              'editorial-input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-b-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
