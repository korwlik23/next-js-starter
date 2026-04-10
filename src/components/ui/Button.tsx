import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { forwardRef } from 'react'

const buttonVariants = cva(
  // base
  'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black disabled:opacity-40 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary: 'bg-white text-black hover:bg-neutral-200 active:bg-neutral-300',
        secondary:
          'bg-neutral-900 text-white border border-neutral-700 hover:border-white active:bg-neutral-800',
        ghost: 'bg-transparent text-white hover:bg-neutral-900 active:bg-neutral-800',
        danger: 'bg-red-600 text-white hover:bg-red-500',
        outline: 'border border-neutral-700 text-white bg-transparent hover:border-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs tracking-wider',
        md: 'h-10 px-5 text-xs tracking-widest uppercase',
        lg: 'h-12 px-6 text-xs tracking-widest uppercase',
        icon: 'h-9 w-9',
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
