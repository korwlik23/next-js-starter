'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui'

export default function ModuleDetailPage() {
  const params = useParams<{ module: string; id: string }>()
  const router = useRouter()
  const t = useTranslations('moduleDetail')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { module: moduleName, id } = params

  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const moduleLabel = (moduleName ?? '').charAt(0).toUpperCase() + (moduleName ?? '').slice(1)
  const formatterLocale = locale === 'th' ? 'th-TH' : 'en-US'

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
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="mb-12 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/${moduleName}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-low)] transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <p
              className="text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {moduleLabel} / {t('recordDetail')}
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                {t('resourceIdentified')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tighter"
            style={{ color: 'var(--color-primary)' }}
          >
            {isLoading ? tCommon('loading') : ((data?.name as string) ?? id)}
          </h1>

          <div className="flex items-center gap-3">
            <Link
              href={`/${moduleName}/${id}/edit`}
              className="btn-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--color-primary)]/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              {t('modify')}
            </Link>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-6 py-2.5 rounded-xl border border-[var(--color-error)]/30 text-[var(--color-error)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-error)]/10 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                {t('archive')}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[var(--color-error)]/5 p-1 rounded-2xl border border-[var(--color-error)]/20 animate-in slide-in-from-right-2">
                <button
                  onClick={handleDelete}
                  className="bg-[var(--color-error)] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg"
                >
                  {t('confirmDelete')}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {tCommon('cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 editorial-card-elevated overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/50">
            <h2
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('generalInformation')}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton width="30%" height="1rem" />
                  <Skeleton width="60%" height="1rem" />
                </div>
              ))}
            </div>
          ) : !data ? (
            <div className="p-20 text-center text-[var(--color-text-faint)]">
              {t('recordNotFound')}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]/50">
              {Object.entries(data)
                .filter(([key]) => !['id', 'created_at', 'updated_at', ...skipKeys].includes(key))
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 px-8 py-6 group hover:bg-[var(--color-surface-low)]/30 transition-colors"
                  >
                    <div className="sm:w-48 shrink-0">
                      <p
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: 'var(--color-text-faint)' }}
                      >
                        {key
                          .replace(/_/g, ' ')
                          .replace(/([A-Z])/g, ' $1')
                          .trim()}
                      </p>
                    </div>
                    <div
                      className="flex-1 text-sm font-medium leading-relaxed"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {val === null || val === undefined ? (
                        <span className="opacity-20">-</span>
                      ) : typeof val === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${val ? 'bg-emerald-500' : 'bg-neutral-500'}`}
                          />
                          <span className={val ? 'text-emerald-500' : ''}>
                            {val ? t('enabled') : t('disabled')}
                          </span>
                        </div>
                      ) : (
                        <span className="group-hover:text-[var(--color-primary)] transition-colors">
                          {String(val)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="editorial-card-elevated p-8 shadow-sm">
            <h2
              className="text-[10px] font-black uppercase tracking-widest mb-6"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('systemMetadata')}
            </h2>
            <div className="space-y-6">
              {[
                { label: t('referenceId'), value: id, icon: 'tag' },
                {
                  label: t('createdOn'),
                  value: data?.created_at
                    ? new Date(data.created_at as string).toLocaleString(formatterLocale)
                    : '-',
                  icon: 'event',
                },
                {
                  label: t('lastModified'),
                  value: data?.updated_at
                    ? new Date(data.updated_at as string).toLocaleString(formatterLocale)
                    : '-',
                  icon: 'update',
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[14px] opacity-40">
                      {item.icon}
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      {item.label}
                    </p>
                  </div>
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-low)] border border-[var(--color-border)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-surface-mid)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                verified
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                {t('verification')}
              </p>
              <p className="text-xs font-bold">{t('dataIntegrityVerified')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
