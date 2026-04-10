import type { Metadata } from 'next'

// ────────────────────────────────────────
// Audit Log Page — แสดงรายการ action log ของระบบ
// เข้าถึงได้เฉพาะ admin/owner
// ────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Audit Log',
}

// จำลองข้อมูล audit log
const DEMO_LOGS = [
  { id: '1', action: 'USER_LOGIN', userId: 'owner', entity: 'User', entityId: 'u1', ipAddress: '127.0.0.1', createdAt: '2026-04-09T10:30:00Z' },
  { id: '2', action: 'USER_UPDATED', userId: 'admin', entity: 'User', entityId: 'u2', ipAddress: '192.168.1.5', createdAt: '2026-04-09T09:15:00Z' },
  { id: '3', action: 'TEAM_INVITE_SENT', userId: 'owner', entity: 'Invitation', entityId: 'inv1', ipAddress: '127.0.0.1', createdAt: '2026-04-09T08:00:00Z' },
  { id: '4', action: 'ROLE_PERMISSION_CHANGED', userId: 'admin', entity: 'RolePermission', entityId: 'rp1', ipAddress: '10.0.0.1', createdAt: '2026-04-08T14:00:00Z' },
  { id: '5', action: 'TENANT_UPDATED', userId: 'owner', entity: 'Tenant', entityId: 't1', ipAddress: '127.0.0.1', createdAt: '2026-04-08T10:00:00Z' },
]

// Badge colors ตาม action type
function GetActionColor(action: string): string {
  if (action.includes('DELETE') || action.includes('REMOVE')) return 'var(--color-error, #e74c3c)'
  if (action.includes('CREATE') || action.includes('INVITE')) return 'var(--color-success, #27ae60)'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return 'var(--color-warning, #e67e22)'
  return 'var(--color-primary)'
}

export default function AuditLogPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Audit Log
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          ประวัติการกระทำทั้งหมดในระบบ — ใครทำอะไร เมื่อไหร่ จากที่ไหน
        </p>
      </div>

      {/* Filters row */}
      <div
        className="flex items-center gap-4 p-4 rounded-lg mb-6"
        style={{
          backgroundColor: 'var(--color-surface-mid)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined text-base">filter_list</span>
          <span>Filter:</span>
        </div>
        <select
          className="text-sm px-3 py-1.5 rounded-md"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          defaultValue=""
        >
          <option value="">ทุก Action</option>
          <option value="USER">User Actions</option>
          <option value="TEAM">Team Actions</option>
          <option value="TENANT">Tenant Actions</option>
          <option value="ROLE">Role Actions</option>
        </select>
        <select
          className="text-sm px-3 py-1.5 rounded-md"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          defaultValue=""
        >
          <option value="">ทุกผู้ใช้</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                เวลา
              </th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Action
              </th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                ผู้ใช้
              </th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Entity
              </th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LOGS.map((log) => (
              <tr
                key={log.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString('th-TH')}
                </td>
                <td className="p-4">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${GetActionColor(log.action)}20`,
                      color: GetActionColor(log.action),
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="p-4" style={{ color: 'var(--color-text)' }}>
                  {log.userId}
                </td>
                <td className="p-4" style={{ color: 'var(--color-text-muted)' }}>
                  {log.entity}
                  {log.entityId && (
                    <span className="text-xs ml-1" style={{ color: 'var(--color-text-faint)' }}>
                      ({log.entityId})
                    </span>
                  )}
                </td>
                <td className="p-4 font-mono text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination hint */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          แสดง {DEMO_LOGS.length} รายการ
        </p>
      </div>
    </div>
  )
}
