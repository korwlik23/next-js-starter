'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal, Badge, Select } from '@/components/ui'
import { DataTable } from '@/components/table/DataTable'
import toast from 'react-hot-toast'
import { api } from '@/services/apiClient'

interface Translation {
  id: string
  locale: string
  namespace: string
  key: string
  value: string
}

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLocale, setCurrentLocale] = useState('th')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Translation | null>(null)

  const [formData, setFormData] = useState({
    locale: 'th',
    namespace: 'common',
    key: '',
    value: '',
  })

  const fetchTranslations = async () => {
    setLoading(true)
    try {
      const res = await api.get<Translation[]>(`/api/admin/translations?locale=${currentLocale}`)
      if (res.data) {
        setTranslations(res.data)
      }
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลคำแปลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTranslations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale])

  const handleOpenModal = (item?: Translation) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        locale: item.locale,
        namespace: item.namespace,
        key: item.key,
        value: item.value,
      })
    } else {
      setEditingItem(null)
      setFormData({
        locale: currentLocale,
        namespace: 'common',
        key: '',
        value: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/api/admin/translations', formData)
      if (res.error) return toast.error(res.error)

      toast.success(editingItem ? 'อัปเดตคำแปลสำเร็จ' : 'เพิ่มคำแปลใหม่สำเร็จ')
      setIsModalOpen(false)
      fetchTranslations()
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const columns = [
    {
      label: 'Namespace',
      key: 'namespace',
      render: (row: Translation) => (
        <Badge variant="neutral" className="text-[10px] uppercase tracking-widest">
          {row.namespace}
        </Badge>
      ),
    },
    {
      label: 'Key',
      key: 'key',
      render: (row: Translation) => (
        <code className="text-xs font-mono text-[var(--color-info)] font-bold">{row.key}</code>
      ),
    },
    {
      label: 'Value',
      key: 'value',
      render: (row: Translation) => <span className="text-sm">{row.value}</span>,
    },
    {
      label: 'Locale',
      key: 'locale',
      render: (row: Translation) => (
        <Badge variant="primary" className="uppercase">
          {row.locale}
        </Badge>
      ),
    },
  ]

  const filteredData = translations.filter(
    (item) =>
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase()) ||
      item.namespace.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Translations
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-subtle)' }}>
            Manage multilingual content and add new languages dynamically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Select
              value={currentLocale}
              onChange={(e) => setCurrentLocale(e.target.value)}
              options={[
                { label: 'Thai (TH)', value: 'th' },
                { label: 'English (EN)', value: 'en' },
                { label: 'Japanese (JA)', value: 'ja' },
                { label: 'Chinese (ZH)', value: 'zh' },
              ]}
            />
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined mr-2">translate</span>
            Add Key
          </Button>
        </div>
      </header>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={loading}
          onSearch={setSearch}
          actions={(row) => (
            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(row)}>
              <span className="material-symbols-outlined text-[1.1rem]">edit</span>
            </Button>
          )}
        />
      </div>

      <Modal
        is_open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Translation' : 'Add New Translation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Locale"
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
              placeholder="e.g. th, en, ja"
              required
              disabled={!!editingItem}
            />
            <Input
              label="Namespace"
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              placeholder="e.g. common, auth"
              required
              disabled={!!editingItem}
            />
          </div>
          <Input
            label="Key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="e.g. welcome_message"
            required
            disabled={!!editingItem}
          />
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
              Value
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Enter translation text..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Translation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
