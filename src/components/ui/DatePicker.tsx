import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { cva, type VariantProps } from 'class-variance-authority'

const datePickerVariants = cva(
  'flex w-full rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-transparent',
  {
    variants: {
      variant: {
        default:
          'border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-500 focus-visible:ring-white focus-visible:border-white',
        filled:
          'border-transparent bg-neutral-900 text-white focus-visible:bg-neutral-800 focus-visible:ring-white',
        error:
          'border-red-500 bg-red-950/20 text-white placeholder:text-red-500/50 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof datePickerVariants> {
  label?: string
  error?: string
  helperText?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, variant, size, label, error, helperText, id, ...props }, ref) => {
    // Determine the active variant (error overrides)
    const activeVariant = error ? 'error' : variant

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type="date"
            id={id}
            className={clsx(datePickerVariants({ variant: activeVariant, size }), '[color-scheme:dark]', className)}
            ref={ref}
            {...props}
          />
        </div>
        {(helperText || error) && (
          <p className={clsx('text-xs', error ? 'text-red-500' : 'text-neutral-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'
