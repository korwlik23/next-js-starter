'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button, Badge, Modal, Input, Skeleton } from '@/components/ui'
import { api } from '@/services/apiClient'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { enUS, th } from 'date-fns/locale'

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
  const t = useTranslations('teamPage')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const dateLocale = locale === 'th' ? th : enUS
  const [data, setData] = useState<TeamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')

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
        toast.error(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [t])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    if (!currentUser?.tenantId) {
      toast.error(t('missingTenant'))
      return
    }

    setIsInviting(true)
    try {
      const res = await api.post('/api/tenant/invite', {
        email: inviteEmail,
        roleId: 'member',
        tenantId: currentUser.tenantId,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(t('inviteSuccess'))
        setIsInviteModalOpen(false)
        setInviteEmail('')
        const teamRes = await api.get<TeamData>('/api/tenant/members')
        if (teamRes.data) setData(teamRes.data)
      }
    } catch {
      toast.error(t('inviteError'))
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
        <Button
          className="flex w-full items-center gap-2 sm:w-auto"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          {t('invite')}
        </Button>
      </div>

      {!currentUser?.tenantId && (
        <div
          className="mb-5 p-4 rounded-[var(--radius-md)] border"
          style={{
            color: 'var(--color-warning, #e67e22)',
            borderColor: 'var(--color-warning, #e67e22)',
          }}
        >
          {t('tenantRequired')}
        </div>
      )}

      {error && (
        <div
          className="mb-5 p-4 rounded-[var(--radius-md)] border"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      <div className="editorial-card-elevated overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-low)' }}>
                {[t('nameEmail'), t('role'), t('status'), t('joinedAt'), t('actions')].map(
                  (label, index) => (
                    <th
                      key={label}
                      className={`${index === 4 ? 'text-right' : 'text-left'} p-4 font-semibold`}
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
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
                          {member.name} {member.id === currentUser?.id && `(${t('you')})`}
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
                      {member.isActive ? tStatus('active') : tStatus('inactive')}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDistanceToNow(new Date(member.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      disabled={member.id === currentUser?.id}
                      className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70 disabled:opacity-30"
                      style={{ color: 'var(--color-error, #e74c3c)' }}
                    >
                      {t('remove')}
                    </button>
                  </td>
                </tr>
              ))}

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
                          {t('waiting')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {invite.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{t('member')}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="warning">{tStatus('pending')}</Badge>
                  </td>
                  <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('sentAt')}{' '}
                    {formatDistanceToNow(new Date(invite.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                      style={{
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-surface-mid)',
                      }}
                    >
                      {t('cancelInvitation')}
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
                    {t('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        is_open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('inviteTitle')}
      >
        <form onSubmit={handleInvite} className="space-y-6 pt-4">
          <Input
            label={t('recipientEmail')}
            type="email"
            placeholder={t('recipientEmailPlaceholder')}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <div
            className="bg-[var(--color-surface-mid)] p-4 rounded-lg text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('inviteHint')}
          </div>
          <div className="flex flex-col-reverse gap-3 mt-6 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)} type="button">
              {tCommon('cancel')}
            </Button>
            <Button variant="primary" type="submit" isLoading={isInviting}>
              {t('sendInvite')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
