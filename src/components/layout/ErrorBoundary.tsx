'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  has_error: boolean
  error: Error | null
}

function DefaultErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const t = useTranslations('components.errorBoundary')

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" role="alert">
      <span
        className="material-symbols-outlined text-4xl"
        style={{ color: 'var(--color-warning, #e67e22)' }}
      >
        warning
      </span>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        {t('title')}
      </h3>
      <p className="text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
        {error?.message || t('message')}
      </p>
      <button onClick={onRetry} className="btn-primary mt-2">
        {t('retry')}
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { has_error: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { has_error: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[ErrorBoundary] Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ has_error: false, error: null })
  }

  render(): ReactNode {
    if (this.state.has_error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleReset} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
