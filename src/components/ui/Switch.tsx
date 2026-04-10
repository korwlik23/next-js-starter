import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { forwardRef } from 'react'

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
      variant: {
        primary: 'data-[state=checked]:bg-white data-[state=unchecked]:bg-neutral-700',
        success: 'data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-neutral-700',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
)

const thumbVariants = cva(
  'pointer-events-none block rounded-full bg-black ring-0 transition-transform data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7',
      },
      variant: {
        primary: 'bg-black',
        success: 'bg-white',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
)

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  error?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      size,
      variant,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      id,
      label,
      description,
      error,
      ...props
    },
    ref
  ) => {
    // Determine controlled vs uncontrolled using internal state is optional
    // For a simple native wrap, we use the input directly but style a visual span.
    return (
      <div className={clsx('flex flex-col gap-1', className)}>
        <label
          className={clsx(
            'flex items-start gap-3',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          htmlFor={id}
        >
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              id={id}
              ref={ref}
              disabled={disabled}
              checked={checked}
              defaultChecked={defaultChecked}
              onChange={(e) => onCheckedChange?.(e.target.checked)}
              className="peer sr-only"
              {...props}
            />
            {/* Visual Switch Track */}
            <div
              className={switchVariants({ size, variant })}
              data-state={checked ? 'checked' : 'unchecked'}
              aria-hidden="true"
            >
              {/* Visual Switch Thumb */}
              <span
                className={thumbVariants({ size, variant: checked && variant === 'success' ? 'success' : 'primary' })}
                data-state={checked ? 'checked' : 'unchecked'}
              />
            </div>
          </div>
          {label && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{label}</span>
              {description && <span className="text-xs text-neutral-400">{description}</span>}
            </div>
          )}
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)
Switch.displayName = 'Switch'
