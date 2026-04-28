'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'

interface AuditLog {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  ipAddress: string | null
  createdAt: string
  user?: {
    name: string
    email: string
  } | null
}

function getActionColor(action: string): string {
  if (action.includes('delete') || action.includes('revoke')) return 'var(--color-error, #e74c3c)'
  if (action.includes('create') || action.includes('invite')) return 'var(--color-success, #27ae60)'
  if (action.includes('update') || action.includes('change')) return 'var(--color-warning, #e67e22)'
  return 'var(--color-primary)'
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true)
      const result = await apiClient<AuditLog[]>('/api/audit?page=1&limit=25')
      if (result.error) {
        setError(result.error)
        setLogs([])
      } else {
        setLogs(result.data ?? [])
      }
      setIsLoading(false)
    }

    loadLogs()
  }, [])

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Audit Log
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          ประวัติการทำงานของระบบจากฐานข้อมูลจริง
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 border"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                เวลา
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Action
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ผู้ใช้
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Entity
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="p-4" colSpan={5}>
                    <Skeleton height="1.5rem" width="100%" />
                  </td>
                </tr>
              ))
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="p-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: `${getActionColor(log.action)}20`,
                        color: getActionColor(log.action),
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-text)' }}>
                    {log.user?.name ?? 'System'}
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>
                    {log.entity ?? '-'}
                    {log.entityId ? (
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-faint)' }}>
                        ({log.entityId})
                      </span>
                    ) : null}
                  </td>
                  <td
                    className="p-4 font-mono text-xs"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {log.ipAddress ?? '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  ยังไม่มี audit log
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
