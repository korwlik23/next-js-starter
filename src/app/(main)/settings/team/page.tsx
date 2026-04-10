import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

// ────────────────────────────────────────
// Team Management Page
// การเชิญคนเข้า Tenant และจัดการ Role
// ────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Team Management',
}

export default function TeamPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            Team Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            จัดการสมาชิกในทีมของคุณ เชิญสมาชิกใหม่ และกำหนดสิทธิ์การใช้งาน
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">person_add</span>
          เชิญสมาชิก (Invite)
        </Button>
      </div>

      {/* Team Members Table */}
      <div
        className="rounded-lg overflow-hidden mb-8"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>ชื่อ / อีเมล</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>บทบาท (Role)</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>สถานะ</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>เข้าร่วมเมื่อ</th>
              <th className="text-right p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Owner Row */}
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
                    A
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>Admin User</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>admin@example.com</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <Badge variant="default">Owner</Badge>
              </td>
              <td className="p-4">
                <Badge variant="success">Active</Badge>
              </td>
              <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                1 ม.ค. 2569
              </td>
              <td className="p-4 text-right">
                <button disabled className="text-xs font-medium px-3 py-1 rounded transition-opacity opacity-50 cursor-not-allowed text-gray-500">
                  แก้ไขไม่ได้
                </button>
              </td>
            </tr>

            {/* Member Row */}
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--color-surface-mid)', color: 'var(--color-text)' }}>
                    U
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>Normal User</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>user@example.com</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <Badge variant="outline">Member</Badge>
              </td>
              <td className="p-4">
                <Badge variant="success">Active</Badge>
              </td>
              <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                15 ก.พ. 2569
              </td>
              <td className="p-4 text-right flex justify-end gap-2">
                <button
                  className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(52, 152, 219, 0.1)' }}
                >
                  แก้ไข Role
                </button>
                <button
                  className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-error, #e74c3c)', backgroundColor: 'rgba(231, 76, 60, 0.1)' }}
                >
                  ลบออก
                </button>
              </td>
            </tr>

             {/* Pending Invitation Row */}
             <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-faint)' }}>
                    ?
                  </div>
                  <div>
                    <p className="font-medium italic" style={{ color: 'var(--color-text-muted)' }}>รอการตอบรับ...</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>pending@example.com</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <Badge variant="outline">Admin</Badge>
              </td>
              <td className="p-4">
                <Badge variant="warning">Pending</Badge>
              </td>
              <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                -
              </td>
              <td className="p-4 text-right flex justify-end gap-2">
                <button
                  className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-mid)' }}
                >
                  ยกเลิกคำเชิญ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  )
}
