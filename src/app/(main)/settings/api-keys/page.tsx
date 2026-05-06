'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Badge, Modal, Input, Skeleton } from '@/components/ui'
import { api } from '@/services/apiClient'
import toast from 'react-hot-toast'

interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const t = useTranslations('apiKeysPage')
  const tStatus = useTranslations('status')
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadKeys() {
    setIsLoading(true)
    setError('')
    const result = await api.get<ApiKeyItem[]>('/api/api-keys')
    if (result.error) {
      setError(result.error)
      setKeys([])
    } else {
      setKeys(result.data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadKeys()
  }, [])

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim()) return

    setIsCreating(true)
    setCreatedKey(null)
    const result = await api.post<{ raw_key: string; name: string }>('/api/api-keys', {
      name: newKeyName.trim(),
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      setCreatedKey(result.data?.raw_key ?? null)
      toast.success(t('created'))
      await loadKeys()
    }
    setIsCreating(false)
  }

  async function revokeKey(id: string) {
    const res = await fetch('/api/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(json?.message ?? t('cannotRevoke'))
      return
    }
    toast.success(t('revoked'))
    await loadKeys()
  }

  async function copyCreatedKey() {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    toast.success(t('copied'))
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            {t('title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <span className="material-symbols-outlined text-base">add</span>
          {t('create')}
        </Button>
      </div>

      {error && (
        <div
          className="mb-5 p-4 rounded-[var(--radius-md)] border"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      <div
        className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] mb-5"
        style={{
          backgroundColor: 'rgba(230, 126, 34, 0.08)',
          border: '1px solid rgba(230, 126, 34, 0.2)',
        }}
      >
        <span
          className="material-symbols-outlined text-lg mt-0.5"
          style={{ color: 'var(--color-warning, #e67e22)' }}
        >
          warning
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {t('warningTitle')}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('warningDescription')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton height="12rem" width="100%" />
      ) : (
        <div className="editorial-card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-low)' }}>
                  {[t('name'), t('prefix'), t('status'), t('lastUsed'), t('createdAt')].map(
                    (label) => (
                      <th
                        key={label}
                        className="text-left p-4 font-semibold"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {label}
                      </th>
                    )
                  )}
                  <th
                    className="text-right p-4 font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text)' }}>
                      {key.name}
                    </td>
                    <td
                      className="p-4 font-mono text-xs"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {key.prefix}...
                    </td>
                    <td className="p-4">
                      <Badge variant={key.isActive ? 'success' : 'outline'}>
                        {key.isActive ? tStatus('active') : tStatus('inactive')}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(key.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!key.isActive}
                        onClick={() => revokeKey(key.id)}
                      >
                        {t('revoke')}
                      </Button>
                    </td>
                  </tr>
                ))}

                {keys.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center p-8"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {t('empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal is_open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('createTitle')}>
        <form onSubmit={createKey} className="space-y-5">
          <Input
            label={t('keyName')}
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t('keyNamePlaceholder')}
          />

          {createdKey && (
            <div className="p-4 rounded-[var(--radius-md)] border border-green-500/30 bg-green-500/10">
              <p className="text-xs mb-2 text-green-300">{t('copyNow')}</p>
              <code className="block break-all text-xs text-green-100">{createdKey}</code>
              <Button type="button" size="sm" className="mt-3" onClick={copyCreatedKey}>
                {t('copy')}
              </Button>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              {t('close')}
            </Button>
            <Button type="submit" isLoading={isCreating}>
              {t('create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
