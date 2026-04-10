import { clsx } from 'clsx'

// ────────────────────────────────────────
// Spinner — คอมโพเนนต์สำหรับการรอโหลด
// ────────────────────────────────────────

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'primary' | 'muted'
}

export function Spinner({ size = 'md', color = 'white', className, ...props }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4',
  }

  const colors = {
    white: 'border-white/20 border-t-white',
    primary: 'border-white/20 border-t-neutral-400',
    muted: 'border-neutral-800 border-t-neutral-500',
  }

  return (
    <div
      className={clsx(
        'animate-spin rounded-full shrink-0',
        sizes[size],
        colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}
