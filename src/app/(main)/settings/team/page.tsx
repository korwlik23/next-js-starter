'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Modal, Input, Skeleton } from '@/components/ui'
import { api } from '@/services/apiClient'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Invitation {
  id: string
  email: string
  roleId: string
  status: string
  expiresAt: string
  createdAt: string
}

interface TeamData {
  members: TeamMember[]
  invitations: Invitation[]
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, teamRes] = await Promise.all([
          api.get<any>('/api/auth/me'),
          api.get<TeamData>('/api/tenant/members'),
        ])

        if (userRes.data) setCurrentUser(userRes.data)
        if (teamRes.error) {
          setError(teamRes.error)
          setData({ members: [], invitations: [] })
        } else {
          setData(teamRes.data ?? { members: [], invitations: [] })
        }
      } catch {
        setData({ members: [], invitations: [] })
        toast.error('ไม่สามารถดึงข้อมูลสมาชิกทีมได้')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    if (!currentUser?.tenantId) {
      toast.error('ไม่พบข้อมูลองค์กรของคุณ')
      return
    }

    setIsInviting(true)
    try {
      // สำหรับ Starter นี้ เราใช้ Role ID แบบง่ายๆ (สมมติ 'member' role id หรือ hardcode ตาม seed)
      // ในระบบจริงควรมี list ให้เลือก
      const res = await api.post('/api/tenant/invite', {
        email: inviteEmail,
        roleId: 'member', // Default role สำหรับคำเชิญ
        tenantId: currentUser.tenantId,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('ส่งคำเชิญเรียบร้อยแล้ว')
        setIsInviteModalOpen(false)
        setInviteEmail('')
        // Refresh data
        const teamRes = await api.get<TeamData>('/api/tenant/members')
        if (teamRes.data) setData(teamRes.data)
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการส่งคำเชิญ')
    } finally {
      setIsInviting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height="2rem" width="200px" />
        <Skeleton height="10rem" width="100%" />
      </div>
    )
  }

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
        <Button className="flex items-center gap-2" onClick={() => setIsInviteModalOpen(true)}>
          <span className="material-symbols-outlined text-base">person_add</span>
          เชิญสมาชิก (Invite)
        </Button>
      </div>

      {!currentUser?.tenantId && (
        <div
          className="mb-8 p-4 border"
          style={{
            color: 'var(--color-warning, #e67e22)',
            borderColor: 'var(--color-warning, #e67e22)',
          }}
        >
          หน้านี้ต้องใช้บัญชีที่อยู่ใน tenant เช่น admin@acme.com / password123
        </div>
      )}

      {error && (
        <div
          className="mb-8 p-4 border"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      {/* Team Members Table */}
      <div
        className="rounded-lg overflow-hidden mb-8"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ชื่อ / อีเมล
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                บทบาท (Role)
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                สถานะ
              </th>
              <th
                className="text-left p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                เข้าร่วมเมื่อ
              </th>
              <th
                className="text-right p-4 font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Members List */}
            {data?.members.map((member) => (
              <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-on-primary)',
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {member.name} {member.id === currentUser?.id && '(คุณ)'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      member.role === 'owner' || member.role === 'admin' ? 'default' : 'outline'
                    }
                  >
                    {member.role}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge variant={member.isActive ? 'success' : 'error'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true, locale: th })}
                </td>
                <td className="p-4 text-right">
                  <button
                    disabled={member.id === currentUser?.id}
                    className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70 disabled:opacity-30"
                    style={{ color: 'var(--color-error, #e74c3c)' }}
                  >
                    ลบออก
                  </button>
                </td>
              </tr>
            ))}

            {/* Invitations List */}
            {data?.invitations.map((invite) => (
              <tr key={invite.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center text-xs font-bold"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-faint)',
                      }}
                    >
                      ?
                    </div>
                    <div>
                      <p
                        className="font-medium italic"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        รอการตอบรับ...
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {invite.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline">Member</Badge>
                </td>
                <td className="p-4">
                  <Badge variant="warning">Pending</Badge>
                </td>
                <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  ส่งเมื่อ{' '}
                  {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: th })}
                </td>
                <td className="p-4 text-right">
                  <button
                    className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                    style={{
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-surface-mid)',
                    }}
                  >
                    ยกเลิกคำเชิญ
                  </button>
                </td>
              </tr>
            ))}

            {data?.members.length === 0 && data?.invitations.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  ไม่พบสมาชิกทีม
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <Modal
        is_open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="เชิญสมาชิกใหม่เข้าร่วมทีม"
      >
        <form onSubmit={handleInvite} className="space-y-6 pt-4">
          <Input
            label="อีเมลผู้รับ"
            type="email"
            placeholder="example@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <div
            className="bg-[var(--color-surface-mid)] p-4 rounded-lg text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            คำเชิญจะมีอายุ 7 วัน ผู้รับจะได้รับอีเมลพร้อมลิงก์เพื่อเข้าสู่ระบบและร่วมทีมโดยอัตโนมัติ
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)} type="button">
              ยกเลิก
            </Button>
            <Button variant="primary" type="submit" isLoading={isInviting}>
              ส่งคำเชิญ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
