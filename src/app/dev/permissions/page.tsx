'use client'

import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '@/constants/roles'
import { Shield, Check, X } from 'lucide-react'

export default function PermissionsDevPage() {
  const roles = Object.values(ROLES)
  const permissions = Object.values(PERMISSIONS)

  return (
    <div className="container mx-auto p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tight">Permission Matrix (RBAC)</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Reference for system roles and their assigned permissions.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
              <th className="p-6 text-left font-black uppercase tracking-wider text-[var(--color-text-faint)]">
                Permission / Action
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  className="p-6 text-center font-black uppercase tracking-wider text-[var(--color-text-faint)]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Shield
                      className={`h-5 w-5 ${role === 'owner' ? 'text-amber-500' : role === 'admin' ? 'text-blue-500' : 'text-slate-400'}`}
                    />
                    {role}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/60">
            {permissions.map((permission) => (
              <tr
                key={permission}
                className="transition-colors hover:bg-[var(--color-surface-low)]/50"
              >
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--color-text)]">{permission}</span>
                    <span className="text-[10px] uppercase font-black text-[var(--color-text-faint)]">
                      Action Code
                    </span>
                  </div>
                </td>
                {roles.map((role) => {
                  const has_permission = ROLE_PERMISSIONS[role]?.includes(permission as any)
                  return (
                    <td key={`${role}-${permission}`} className="p-6 text-center">
                      {has_permission ? (
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-green-500/10">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-red-500/10">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl bg-blue-500/5 p-6 border border-blue-500/10">
        <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Usage in Code
        </h3>
        <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono">
          {'// Component level\n'}
          {'<PermissionGuard permission="user.create">\n'}
          {'  <Button>Create User</Button>\n'}
          {'</PermissionGuard>\n\n'}
          {'// Hook level\n'}
          {'const { hasPermission } = useAuth();\n'}
          {"if (hasPermission('user.delete')) { ... }"}
        </code>
      </div>
    </div>
  )
}
