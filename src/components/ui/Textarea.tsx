'use client'

import { useState, type ChangeEventHandler, type ComponentPropsWithoutRef } from 'react'
import { Textarea as FormTextarea } from '@/components/form'

type FormTextareaProps = ComponentPropsWithoutRef<typeof FormTextarea>

export interface TextareaProps extends FormTextareaProps {
  hint?: string
  showCount?: boolean
}

function valueLength(value: unknown) {
  return value == null ? 0 : String(value).length
}

/**
 * Shared textarea contract backed by the existing form implementation.
 * The adapter adds optional hint and bounded character feedback without
 * duplicating the existing field rendering behavior.
 */
export function Textarea({
  hint,
  showCount = false,
  value,
  defaultValue,
  maxLength,
  onChange,
  ...props
}: TextareaProps) {
  const [uncontrolledLength, setUncontrolledLength] = useState(() => valueLength(defaultValue))
  const isControlled = value !== undefined
  const currentLength = isControlled ? valueLength(value) : uncontrolledLength

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    if (showCount) {
      setUncontrolledLength(event.target.value.length)
    }
    onChange?.(event)
  }

  return (
    <div className="w-full">
      <FormTextarea
        {...props}
        aria-label={props['aria-label'] ?? props.label}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={showCount ? handleChange : onChange}
      />
      {hint && !props.error && (
        <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>
      )}
      {showCount && typeof maxLength === 'number' && (
        <p className="mt-1 text-right text-xs text-neutral-500" aria-live="polite">
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  )
}

Textarea.displayName = 'Textarea'
