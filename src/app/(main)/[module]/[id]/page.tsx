'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui'

export default function ModuleDetailPage() {
  const params = useParams<{ module: string; id: string }>()
  const router = useRouter()
  const { module: moduleName, id } = params

  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const moduleLabel = (moduleName ?? '').charAt(0).toUpperCase() + (moduleName ?? '').slice(1)

  useEffect(() => {
    fetch(`/api/${moduleName}/${id}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? null))
      .finally(() => setIsLoading(false))
  }, [moduleName, id])

  async function handleDelete() {
    const res = await fetch(`/api/${moduleName}/${id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/${moduleName}`)
  }

  const skipKeys = ['password', 'deletedAt']

  return (
    <div>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/${moduleName}`}
            className="text-neutral-600 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </Link>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-neutral-500 font-bold">
            {moduleLabel} / Detail
          </p>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">
            {isLoading ? '...' : ((data?.name as string) ?? id)}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/${moduleName}/${id}/edit`}
              className="border border-neutral-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </Link>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="border border-red-900 text-red-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-red-500 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-500 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="border border-neutral-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className="max-w-xl border"
        style={{ backgroundColor: '#111111', borderColor: '#1a1a1a' }}
      >
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-neutral-500">ไม่พบข้อมูล</div>
        ) : (
          <div>
            {Object.entries(data)
              .filter(([key]) => !skipKeys.includes(key))
              .map(([key, val], i, arr) => (
                <div
                  key={key}
                  className="flex gap-6 px-6 py-4"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none' }}
                >
                  <div className="w-36 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                  <div className="flex-1 text-sm text-neutral-300 break-all">
                    {val === null || val === undefined ? (
                      <span className="text-neutral-700">—</span>
                    ) : typeof val === 'boolean' ? (
                      <span className={val ? 'text-emerald-400' : 'text-neutral-500'}>
                        {val ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
