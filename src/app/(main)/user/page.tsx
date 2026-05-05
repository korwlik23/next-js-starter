'use client'

import { useState, useEffect } from 'react'
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
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Form state
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
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
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
        password: '', // ไม่แก้รหัสผ่านตรงนี้
        roleIds: user.roles.map((r) => r.role.id),
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
        // แก้ไข User (ยกเว้นรหัสผ่าน)
        const res = await api.patch(`/api/user/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          roleIds: formData.roleIds,
        })
        if (res.error) return toast.error(res.error)
        toast.success('อัปเดตผู้ใช้งานสำเร็จ')
      } else {
        // สร้าง User ใหม่
        const res = await api.post('/api/user', formData)
        if (res.error) return toast.error(res.error)
        toast.success('สร้างผู้ใช้งานสำเร็จ')
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?')) return
    try {
      const res = await api.delete(`/api/user/${id}`)
      if (res.error) return toast.error(res.error)
      toast.success('ลบผู้ใช้งานสำเร็จ')
      fetchUsers()
    } catch {
      toast.error('ไม่สามารถลบผู้ใช้งานได้')
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
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
      label: 'Roles',
      render: (row: User) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((r) => (
            <Badge key={r.role.id} variant="secondary" size="sm" className="capitalize">
              {r.role.name}
            </Badge>
          ))}
          {row.roles.length === 0 && (
            <span className="text-xs text-neutral-400 italic">No roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: User) => (
        <Badge variant={row.isActive ? 'primary' : 'default'} size="sm">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
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
            User Directory
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-subtle)' }}>
            Manage your organization&apos;s members and their access levels.
          </p>
        </div>
        <Can I={PERMISSIONS.USER_CREATE}>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined mr-2">person_add</span>
            Add New User
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

      {/* CREATE/EDIT MODAL */}
      <Modal
        is_open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {!editingUser && (
              <Input
                label="Initial Password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Assign Roles
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
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
