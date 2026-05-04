import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { forwardRef } from 'react'

const buttonVariants = cva(
  // base
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-45 disabled:pointer-events-none select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 active:opacity-80',
        secondary:
          'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] hover:border-[var(--color-primary)]',
        ghost:
          'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-low)] active:bg-[var(--color-surface-mid)]',
        danger: 'bg-[var(--color-error)] text-white hover:opacity-90',
        outline:
          'border border-[var(--color-border-strong)] text-[var(--color-text)] bg-transparent hover:border-[var(--color-primary)]',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 text-xs uppercase',
        lg: 'h-11 px-5 text-sm uppercase',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">
            progress_activity
          </span>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
