'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner, Input, Button } from '@/components/ui'

const skipKeys = ['id', 'password', 'deletedAt', 'createdAt', 'updatedAt', 'roles', 'permissions']

export default function ModuleEditPage() {
  const params = useParams<{ module: string; id: string }>()
  const router = useRouter()
  const { module: moduleName, id } = params
  const moduleLabel = (moduleName ?? '').charAt(0).toUpperCase() + (moduleName ?? '').slice(1)

  const [fields, setFields] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch(`/api/${moduleName}/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const editable: Record<string, string> = {}
          for (const [k, v] of Object.entries(json.data)) {
            if (!skipKeys.includes(k) && typeof v !== 'object') {
              editable[k] = v === null ? '' : String(v)
            }
          }
          setFields(editable)
        }
      })
      .finally(() => setIsLoading(false))
  }, [moduleName, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/${moduleName}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? 'เกิดข้อผิดพลาด')
        return
      }
      router.push(`/${moduleName}/${id}`)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/${moduleName}/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-low)] hover:text-[var(--color-primary)]"
            aria-label={`Back to ${moduleLabel} detail`}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <p className="text-[0.7rem] uppercase font-bold text-[var(--color-text-faint)]">
            {moduleLabel} / Edit
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">
          Edit {moduleLabel}
        </h1>
      </header>

      <div className="max-w-xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="editorial-card-elevated p-4 sm:p-6 space-y-5">
            {Object.entries(fields).map(([key, val]) => (
              <div key={key}>
                <Input
                  label={key.replace(/([A-Z])/g, ' $1').trim()}
                  type={key === 'email' ? 'email' : 'text'}
                  value={val}
                  onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
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
                Save Changes
              </Button>
              <Link href={`/${moduleName}/${id}`}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
