'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Badge } from '@/components/ui'
import { DataTable } from '@/components/table/DataTable'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { api } from '@/services/apiClient'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  entity: string | null
  entityId: string | null
  metadata: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

interface AuditLogListResponse {
  data: AuditLog[]
  meta: { total: number }
}

export default function AuditLogsPage() {
  const t = useTranslations('auditLogsPage')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get<AuditLogListResponse>(
        `/api/admin/audit-logs?page=${page}&limit=${limit}&search=${search}`
      )
      if (res.data) {
        setLogs(res.data.data)
        setTotal(res.data.meta.total)
      }
    } catch {
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  const columns = [
    {
      label: t('timestamp'),
      key: 'createdAt',
      render: (row: AuditLog) => (
        <div className="flex flex-col">
          <span className="font-medium">{format(new Date(row.createdAt), 'MMM dd, HH:mm:ss')}</span>
          <span className="text-[10px] text-[var(--color-text-faint)]">
            {format(new Date(row.createdAt), 'yyyy')}
          </span>
        </div>
      ),
    },
    {
      label: t('user'),
      key: 'user',
      render: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-mid)] flex items-center justify-center text-[10px] font-bold">
            {row.user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{row.user?.name || t('system')}</span>
            <span className="text-[10px] text-[var(--color-text-faint)] truncate">
              {row.user?.email || '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: t('action'),
      key: 'action',
      render: (row: AuditLog) => {
        let variant: 'neutral' | 'success' | 'danger' | 'warning' = 'neutral'
        if (row.action.includes('CREATE')) variant = 'success'
        if (row.action.includes('DELETE')) variant = 'danger'
        if (row.action.includes('UPDATE')) variant = 'warning'
        if (row.action.includes('LOGIN_SUCCESS')) variant = 'success'
        if (row.action.includes('LOGIN_FAILED')) variant = 'danger'

        return (
          <Badge variant={variant} className="font-mono text-[10px] tracking-tighter">
            {row.action}
          </Badge>
        )
      },
    },
    {
      label: t('target'),
      key: 'entity',
      render: (row: AuditLog) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold">{row.entity || '-'}</span>
          <span className="text-[10px] text-[var(--color-text-faint)] font-mono">
            {row.entityId || '-'}
          </span>
        </div>
      ),
    },
    {
      label: t('details'),
      key: 'metadata',
      render: (row: AuditLog) => {
        if (!row.metadata) return <span className="text-[var(--color-text-faint)]">-</span>
        try {
          const meta = JSON.parse(row.metadata)
          return (
            <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
              <code className="text-[10px] bg-[var(--color-surface-low)] p-1 rounded border border-[var(--color-border)]">
                {JSON.stringify(meta)}
              </code>
            </div>
          )
        } catch {
          return <span className="text-xs">{row.metadata}</span>
        }
      },
    },
    {
      label: t('source'),
      key: 'ipAddress',
      render: (row: AuditLog) => (
        <div className="flex flex-col">
          <span className="text-xs font-mono">{row.ipAddress}</span>
          <span
            className="text-[9px] text-[var(--color-text-faint)] truncate max-w-[120px]"
            title={row.userAgent || ''}
          >
            {row.userAgent}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('title')}
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-subtle)' }}>
            {t('description')}
          </p>
        </div>
        <Button variant="ghost" onClick={fetchLogs} disabled={loading}>
          <span className={`material-symbols-outlined mr-2 ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {t('refresh')}
        </Button>
      </header>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={logs}
          total={total}
          page={page}
          limit={limit}
          isLoading={loading}
          onPageChange={setPage}
          onSearch={setSearch}
        />
      </div>
    </div>
  )
}
