import { clsx } from 'clsx'

// ────────────────────────────────────────
// Badge — คอมโพเนนต์สำหรับแสดงสถานะ หรือแท็ก
// ────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-800 text-neutral-200 border border-neutral-700',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    outline: 'bg-transparent text-neutral-400 border border-neutral-600',
  }

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-medium uppercase tracking-wider rounded-full whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
