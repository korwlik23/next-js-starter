'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-neutral-700 mb-4">error</span>
            <p className="text-sm text-neutral-500 mb-4">เกิดข้อผิดพลาดในการแสดงผล</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-[10px] font-bold uppercase tracking-widest border border-neutral-700 text-white px-4 py-2 hover:border-white transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

// ────────────────────────────────────────
// EmptyState
// ────────────────────────────────────────
interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon = 'inbox',
  title = 'ไม่พบข้อมูล',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="material-symbols-outlined text-5xl text-neutral-800 mb-5">{icon}</span>
      <p className="text-base font-semibold text-neutral-400 mb-1">{title}</p>
      {description && <p className="text-sm text-neutral-600 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

// ────────────────────────────────────────
// LoadingOverlay
// ────────────────────────────────────────
export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <span className="material-symbols-outlined animate-spin text-3xl text-neutral-400">
        progress_activity
      </span>
    </div>
  )
}
