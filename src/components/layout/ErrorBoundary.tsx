'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────
// ErrorBoundary — React Error Boundary Component
// จับ error ที่เกิดใน children component tree
// แสดง fallback UI แทนที่จะทำให้ทั้งหน้าพัง
// ────────────────────────────────────────

interface ErrorBoundaryProps {
  /** เนื้อหาที่ต้องการ wrap ด้วย error boundary */
  children: ReactNode
  /** UI ที่จะแสดงเมื่อเกิด error (ถ้าไม่ระบุจะใช้ default) */
  fallback?: ReactNode
  /** callback เมื่อเกิด error */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  has_error: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { has_error: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // อัปเดต state เพื่อแสดง fallback UI
    return { has_error: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // บันทึก error ลง logger
    logger.error('[ErrorBoundary] Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    // ────────────────────────────────────────
    // TODO: (Enterprise Ready) INTEGRATE SENTRY HERE
    // Ex: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // ────────────────────────────────────────

    // เรียก callback ถ้ามี
    this.props.onError?.(error, errorInfo)
  }

  // ฟังก์ชัน reset error state เพื่อลองใหม่
  HandleReset = () => {
    this.setState({ has_error: false, error: null })
  }

  render(): ReactNode {
    if (this.state.has_error) {
      // ถ้ามี custom fallback ให้ใช้
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div
          className="flex flex-col items-center justify-center gap-4 p-12 text-center"
          role="alert"
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: 'var(--color-warning, #e67e22)' }}
          >
            warning
          </span>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            เกิดข้อผิดพลาดบางอย่าง
          </h3>
          <p
            className="text-sm max-w-md"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {this.state.error?.message || 'ระบบพบปัญหาที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง'}
          </p>
          <button
            onClick={this.HandleReset}
            className="btn-primary mt-2"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
