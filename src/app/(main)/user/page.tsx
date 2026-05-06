'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/services/apiClient'
import { Button, Input, Modal, Badge, Can } from '@/components/ui'
import { DataTable } from '@/components/table/DataTable'
import toast from 'react-hot-toast'
import { PERMISSIONS } from '@/constants'
import { format } from 'date-fns'

interface Role {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  isActive: boolean
  createdAt: string
  roles: { role: Role }[]
}

export default function UserManagementPage() {
  const t = useTranslations('userPage')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('status')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: User[]; meta: { total: number } }>(
        `/api/user?page=${page}&limit=${limit}&search=${search}`
      )
      if (res.data) {
        setUsers(res.data.data)
        setTotal(res.data.meta.total)
      }
    } catch {
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await api.get<Role[]>('/api/role')
      if (res.data) setRoles(res.data)
    } catch (error) {
      console.error('Fetch roles error', error)
    }
  }

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        roleIds: user.roles.map((role) => role.role.id),
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        roleIds: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const res = await api.patch(`/api/user/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          roleIds: formData.roleIds,
        })
        if (res.error) return toast.error(res.error)
        toast.success(t('updateSuccess'))
      } else {
        const res = await api.post('/api/user', formData)
        if (res.error) return toast.error(res.error)
        toast.success(t('createSuccess'))
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch {
      toast.error(t('saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return
    try {
      const res = await api.delete(`/api/user/${id}`)
      if (res.error) return toast.error(res.error)
      toast.success(t('deleteSuccess'))
      fetchUsers()
    } catch {
      toast.error(t('deleteError'))
    }
  }

  const columns = [
    {
      key: 'user',
      label: t('user'),
      render: (row: User) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--color-surface-mid)] flex items-center justify-center text-[var(--color-text-muted)] font-bold overflow-hidden border border-[var(--color-border)]">
            {row.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
            ) : (
              row.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-[var(--color-text)]">{row.name}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: t('roles'),
      render: (row: User) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role) => (
            <Badge key={role.role.id} variant="secondary" size="sm" className="capitalize">
              {role.role.name}
            </Badge>
          ))}
          {row.roles.length === 0 && (
            <span className="text-xs text-neutral-400 italic">{t('noRoles')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('status'),
      render: (row: User) => (
        <Badge variant={row.isActive ? 'primary' : 'default'} size="sm">
          {row.isActive ? tStatus('active') : tStatus('inactive')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: t('joined'),
      render: (row: User) => (
        <span className="text-xs text-[var(--color-text-muted)]">
          {format(new Date(row.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
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
        <Can I={PERMISSIONS.USER_CREATE}>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined mr-2">person_add</span>
            {t('addNewUser')}
          </Button>
        </Can>
      </header>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={users}
          total={total}
          page={page}
          limit={limit}
          isLoading={loading}
          onPageChange={setPage}
          onSearch={setSearch}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Can I={PERMISSIONS.USER_UPDATE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(row)}
                  className="h-8 w-8 p-0"
                >
                  <span className="material-symbols-outlined text-[1.1rem]">edit</span>
                </Button>
              </Can>
              <Can I={PERMISSIONS.USER_DELETE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(row.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <span className="material-symbols-outlined text-[1.1rem]">delete</span>
                </Button>
              </Can>
            </div>
          )}
        />
      </div>

      <Modal
        is_open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? t('editUser') : t('createNewUser')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <Input
              label={t('fullName')}
              placeholder={t('fullNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label={t('emailAddress')}
              type="email"
              placeholder={t('emailPlaceholder')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {!editingUser && (
              <Input
                label={t('initialPassword')}
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                {t('assignRoles')}
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      formData.roleIds.includes(role.id)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          roleIds: prev.roleIds.includes(role.id)
                            ? prev.roleIds.filter((id) => id !== role.id)
                            : [...prev.roleIds, role.id],
                        }))
                      }}
                    />
                    <span
                      className={`material-symbols-outlined text-base ${
                        formData.roleIds.includes(role.id)
                          ? 'text-[var(--color-primary)]'
                          : 'text-neutral-300'
                      }`}
                    >
                      {formData.roleIds.includes(role.id) ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span className="text-sm font-medium capitalize">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? tCommon('save') : t('createUser')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
