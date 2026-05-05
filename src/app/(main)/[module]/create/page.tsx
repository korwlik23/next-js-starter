'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Button } from '@/components/ui'

export default function ModuleCreatePage() {
  const params = useParams<{ module: string }>()
  const router = useRouter()
  const moduleName = params.module ?? 'items'
  const moduleLabel = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>(
    moduleName === 'user' ? { name: '', email: '', password: '' } : { name: '', email: '' }
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/${moduleName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? 'เกิดข้อผิดพลาด')
        return
      }
      router.push(`/${moduleName}`)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/${moduleName}`}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-low)] hover:text-[var(--color-primary)]"
            aria-label={`Back to ${moduleLabel}`}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <p className="text-[0.7rem] uppercase font-bold text-[var(--color-text-faint)]">
            {moduleLabel} / New
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">
          Create {moduleLabel}
        </h1>
      </header>

      {/* Form */}
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="editorial-card-elevated p-4 sm:p-6 space-y-5">
          {Object.entries(fields).map(([key, val]) => (
            <div key={key}>
              <Input
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                type={key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'}
                value={val}
                onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Enter ${key}...`}
                required
              />
            </div>
          ))}

          {error && (
            <div className="rounded-[var(--radius-md)] text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Create {moduleLabel}
            </Button>
            <Link href={`/${moduleName}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
