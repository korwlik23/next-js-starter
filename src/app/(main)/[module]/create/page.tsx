'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ModuleCreatePage() {
  const params = useParams<{ module: string }>()
  const router = useRouter()
  const moduleName = params.module ?? 'items'
  const moduleLabel = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({
    name: '',
    email: '',
  })

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
    <div>
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/${moduleName}`}
            className="text-neutral-600 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </Link>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-neutral-500 font-bold">
            {moduleLabel} / New
          </p>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white">
          Create {moduleLabel}
        </h1>
      </header>

      {/* Form */}
      <div className="max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="border p-8 space-y-8"
          style={{ backgroundColor: '#111111', borderColor: '#1a1a1a' }}
        >
          {Object.entries(fields).map(([key, val]) => (
            <div key={key}>
              <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type={key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'}
                value={val}
                onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Enter ${key}...`}
                className="editorial-input w-full"
                required
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
              Create {moduleLabel}
            </button>
            <Link
              href={`/${moduleName}`}
              className="border border-neutral-700 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
