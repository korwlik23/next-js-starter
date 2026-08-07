import { clsx } from 'clsx'

export type AlertVariant = 'neutral' | 'success' | 'warning' | 'error'

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title?: React.ReactNode
  dismissible?: boolean
  dismissLabel?: string
  onDismiss?: () => void
}

const iconByVariant: Record<AlertVariant, string> = {
  neutral: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const toneByVariant: Record<AlertVariant, string> = {
  neutral: 'border-[var(--color-border)] bg-[var(--color-surface-low)] text-[var(--color-text)]',
  success: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-text)]',
  warning: 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 text-[var(--color-text)]',
  error: 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10 text-[var(--color-text)]',
}

const iconToneByVariant: Record<AlertVariant, string> = {
  neutral: 'text-[var(--color-info)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
}

export function Alert({
  variant = 'neutral',
  title,
  dismissible = false,
  dismissLabel,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  const role = variant === 'error' ? 'alert' : 'status'

  return (
    <div
      {...props}
      className={clsx(
        'flex items-start gap-3 rounded-lg border p-4 text-sm',
        toneByVariant[variant],
        className
      )}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
    >
      <span className={clsx('material-symbols-outlined mt-0.5 shrink-0', iconToneByVariant[variant])} aria-hidden="true">
        {iconByVariant[variant]}
      </span>
      <div className="min-w-0 flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        <div className={clsx(title && 'mt-1', 'text-sm')}>{children}</div>
      </div>
      {dismissible && dismissLabel && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label={dismissLabel}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            close
          </span>
        </button>
      )}
    </div>
  )
}
