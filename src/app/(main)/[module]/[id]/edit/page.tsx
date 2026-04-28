'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui'

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
    <div>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/${moduleName}/${id}`}
            className="text-neutral-600 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </Link>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-neutral-500 font-bold">
            {moduleLabel} / Edit
          </p>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white">Edit {moduleLabel}</h1>
      </header>

      <div className="max-w-xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border p-8 space-y-8"
            style={{ backgroundColor: '#111111', borderColor: '#1a1a1a' }}
          >
            {Object.entries(fields).map(([key, val]) => (
              <div key={key}>
                <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={val}
                  onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="editorial-input w-full"
                />
              </div>
            ))}

            {error && (
              <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                )}
                Save Changes
              </button>
              <Link
                href={`/${moduleName}/${id}`}
                className="border border-neutral-700 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
