'use client'

import { useState, useEffect } from 'react'
import { api } from '@/services/apiClient'
import { Button, Input, Modal, Checkbox, Badge, Skeleton, Can } from '@/components/ui'
import toast from 'react-hot-toast'
import { PERMISSIONS } from '@/constants'

interface Permission {
  id: string
  name: string
  module: string
  action: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get<Role[]>('/api/role'),
        api.get<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>(
          '/api/permission'
        ),
      ])

      if (rolesRes.data) setRoles(rolesRes.data)
      if (permsRes.data) {
        setPermissions(permsRes.data.permissions)
        setGroupedPermissions(permsRes.data.grouped)
      }
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permission_ids: role.permissions.map((p) => p.id),
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permission_ids: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleTogglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((p) => p !== id)
        : [...prev.permission_ids, id],
    }))
  }

  const handleToggleModule = (moduleName: string, checked: boolean) => {
    const modulePermIds = groupedPermissions[moduleName].map((p) => p.id)
    setFormData((prev) => {
      const otherPermIds = prev.permission_ids.filter((id) => !modulePermIds.includes(id))
      return {
        ...prev,
        permission_ids: checked ? [...otherPermIds, ...modulePermIds] : otherPermIds,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingRole ? `/api/role/${editingRole.id}` : '/api/role'
      const method = editingRole ? 'patch' : 'post'

      const res = await api[method]<Role>(url, formData)

      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(editingRole ? 'อัปเดต Role สำเร็จ' : 'สร้าง Role สำเร็จ')
      setIsModalOpen(false)
      fetchData()
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Role นี้?')) return
    try {
      const res = await api.delete(`/api/role/${id}`)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('ลบ Role สำเร็จ')
      fetchData()
    } catch {
      toast.error('ไม่สามารถลบ Role ได้')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width="200px" height="40px" />
          <Skeleton width="120px" height="40px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="200px" border_radius="1rem" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Role Management
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-subtle)' }}>
            Define and manage access levels for your team members.
          </p>
        </div>
        <Can I={PERMISSIONS.ROLE_CREATE}>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="shadow-lg shadow-blue-500/20"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Create New Role
          </Button>
        </Can>
      </header>

      {/* ROLE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="editorial-card-elevated group relative flex flex-col p-6 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <span className="material-symbols-outlined text-[1.25rem]">
                    {role.isSystem ? 'verified_user' : 'person_outline'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                    {role.name}
                  </h3>
                  {role.isSystem && (
                    <Badge variant="default" size="sm" className="mt-0.5">
                      System
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <p
              className="text-sm line-clamp-2 mb-6 flex-1"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              {role.description || 'No description provided.'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-sm">key</span>
                <span className="text-xs font-bold text-gray-500">
                  {role.permissions.length} Permissions
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Can I={PERMISSIONS.ROLE_UPDATE}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(role)}
                    className="h-8 w-8 p-0"
                    title={role.isSystem ? 'System Role cannot be edited' : 'Edit Role'}
                    disabled={role.isSystem}
                  >
                    <span className="material-symbols-outlined text-[1.1rem]">edit</span>
                  </Button>
                </Can>
                {!role.isSystem && (
                  <Can I={PERMISSIONS.ROLE_DELETE}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Delete Role"
                    >
                      <span className="material-symbols-outlined text-[1.1rem]">delete</span>
                    </Button>
                  </Can>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal
        is_open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Role Name"
              placeholder="e.g. editor, moderator"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                })
              }
              required
              disabled={!!editingRole && editingRole.isSystem}
              hint="Use lowercase, numbers, underscores or hyphens only."
            />
            <Input
              label="Description"
              placeholder="What can this role do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                Permissions Matrix
              </h4>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {formData.permission_ids.length} / {permissions.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                const isAllSelected = modulePerms.every((p) =>
                  formData.permission_ids.includes(p.id)
                )
                return (
                  <div
                    key={moduleName}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-sm capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {moduleName}
                      </h5>
                      <button
                        type="button"
                        onClick={() => handleToggleModule(moduleName, !isAllSelected)}
                        className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                      >
                        {isAllSelected ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modulePerms.map((perm) => (
                        <Checkbox
                          key={perm.id}
                          label={perm.action}
                          description={perm.description}
                          checked={formData.permission_ids.includes(perm.id)}
                          onChange={() => handleTogglePermission(perm.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
