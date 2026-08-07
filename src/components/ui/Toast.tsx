'use client'

import toast, { type ToastOptions } from 'react-hot-toast'
import { createElement } from 'react'

export type ToastVariant = 'default' | 'success' | 'warning' | 'error'

export function showToast(message: string, variant: ToastVariant = 'default', options?: ToastOptions) {
  if (variant === 'success') return toast.success(message, options)
  if (variant === 'error') return toast.error(message, options)
  if (variant === 'warning') {
    return toast(message, {
      ...options,
      icon: createElement(
        'span',
        { className: 'material-symbols-outlined', 'aria-hidden': true },
        'warning'
      ),
    })
  }
  return toast(message, options)
}

export function dismissToast(toastId?: string) {
  toast.dismiss(toastId)
}
