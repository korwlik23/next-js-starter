'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export interface SelectMenuOption {
  label: string
  value: string
  disabled?: boolean
}

interface SelectMenuProps {
  value: string
  options: SelectMenuOption[]
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  'aria-label'?: string
}

export function SelectMenu({
  value,
  options,
  onValueChange,
  label,
  placeholder,
  disabled = false,
  className,
  buttonClassName,
  'aria-label': ariaLabel,
}: SelectMenuProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  function selectValue(nextValue: string) {
    onValueChange(nextValue)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const enabledOptions = options.filter((option) => !option.disabled)
    const currentIndex = enabledOptions.findIndex((option) => option.value === value)

    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen((current) => !current)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const fallbackIndex = direction === 1 ? 0 : enabledOptions.length - 1
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : (currentIndex + direction + enabledOptions.length) % enabledOptions.length
      const nextOption = enabledOptions[nextIndex]
      if (nextOption) onValueChange(nextOption.value)
      setIsOpen(true)
    }
  }

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
          {label}
        </label>
      )}

      <button
        type="button"
        aria-label={ariaLabel ?? label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-left text-sm font-semibold text-[var(--color-text)] outline-none transition',
          'hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15',
          disabled && 'cursor-not-allowed opacity-50',
          buttonClassName
        )}
      >
        <span className={clsx('truncate', !selectedOption && 'text-[var(--color-text-faint)]')}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-[var(--color-text-faint)] transition',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-2xl shadow-black/35"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => selectValue(option.value)}
                className={clsx(
                  'flex min-h-9 w-full items-center justify-between gap-3 rounded px-2.5 text-left text-sm font-semibold transition-colors',
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-low)]',
                  option.disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
