'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('rolePage')
  const tCommon = useTranslations('common')
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as string[],
  })

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error(t('loadError'))
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
        permission_ids: role.permissions.map((permission) => permission.id),
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
        ? prev.permission_ids.filter((permissionId) => permissionId !== id)
        : [...prev.permission_ids, id],
    }))
  }

  const handleToggleModule = (moduleName: string, checked: boolean) => {
    const modulePermIds = groupedPermissions[moduleName].map((permission) => permission.id)
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

      toast.success(editingRole ? t('updateSuccess') : t('createSuccess'))
      setIsModalOpen(false)
      fetchData()
    } catch {
      toast.error(t('saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return
    try {
      const res = await api.delete(`/api/role/${id}`)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(t('deleteSuccess'))
      fetchData()
    } catch {
      toast.error(t('deleteError'))
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
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} width="100%" height="200px" border_radius="1rem" />
          ))}
        </div>
      </div>
    )
  }

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
        <Can I={PERMISSIONS.ROLE_CREATE}>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="shadow-lg shadow-blue-500/20"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            {t('createNewRole')}
          </Button>
        </Can>
      </header>

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
                      {t('system')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <p
              className="text-sm line-clamp-2 mb-6 flex-1"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              {role.description || t('noDescription')}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-sm">key</span>
                <span className="text-xs font-bold text-gray-500">
                  {t('permissions', { count: role.permissions.length })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Can I={PERMISSIONS.ROLE_UPDATE}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(role)}
                    className="h-8 w-8 p-0"
                    title={role.isSystem ? t('systemRoleCannotEdit') : t('editRole')}
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
                      title={t('deleteRole')}
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

      <Modal
        is_open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? t('editRole') : t('createNewRole')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('roleName')}
              placeholder={t('roleNamePlaceholder')}
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                })
              }
              required
              disabled={!!editingRole && editingRole.isSystem}
              hint={t('nameHint')}
            />
            <Input
              label={t('descriptionLabel')}
              placeholder={t('descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                {t('permissionsMatrix')}
              </h4>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {t('selected', {
                  selected: formData.permission_ids.length,
                  total: permissions.length,
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                const isAllSelected = modulePerms.every((permission) =>
                  formData.permission_ids.includes(permission.id)
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
                        {isAllSelected ? t('unselectAll') : t('selectAll')}
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
              {tCommon('cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {editingRole ? tCommon('save') : t('createRole')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
