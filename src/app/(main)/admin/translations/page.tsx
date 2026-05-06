'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Edit3, Languages, Layers3, Plus, RefreshCw, Search, Type } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Input, Modal, Badge, Select } from '@/components/ui'
import { api } from '@/services/apiClient'

interface Translation {
  id: string
  locale: string
  namespace: string
  key: string
  value: string
}

const LOCALES = [
  { label: 'Thai', value: 'th' },
  { label: 'English', value: 'en' },
]

const INITIAL_FORM = {
  locale: 'th',
  namespace: 'common',
  key: '',
  value: '',
}

export default function TranslationsPage() {
  const t = useTranslations('translationsAdmin')
  const tCommon = useTranslations('common')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentLocale, setCurrentLocale] = useState('th')
  const [selectedNamespace, setSelectedNamespace] = useState('__all__')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Translation | null>(null)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState(INITIAL_FORM)

  async function fetchTranslations(locale = currentLocale) {
    setLoading(true)
    setError('')

    try {
      const res = await api.get<Translation[]>(
        `/api/admin/translations?locale=${encodeURIComponent(locale)}`
      )

      if (res.error) {
        setTranslations([])
        setError(res.error)
        toast.error(res.error)
        return
      }

      setTranslations(res.data ?? [])
    } catch {
      setTranslations([])
      setError(t('loadError'))
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTranslations(currentLocale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale])

  const namespaces = useMemo(() => {
    return Array.from(new Set(translations.map((item) => item.namespace))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [translations])

  const namespaceCounts = useMemo(() => {
    return translations.reduce<Record<string, number>>((counts, item) => {
      counts[item.namespace] = (counts[item.namespace] ?? 0) + 1
      return counts
    }, {})
  }, [translations])

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()

    return translations.filter((item) => {
      const matchesNamespace =
        selectedNamespace === '__all__' || item.namespace === selectedNamespace
      const matchesSearch =
        !query ||
        item.key.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        item.namespace.toLowerCase().includes(query)

      return matchesNamespace && matchesSearch
    })
  }, [search, selectedNamespace, translations])

  const stats = useMemo(
    () => ({
      total: translations.length,
      namespaces: namespaces.length,
      emptyValues: translations.filter((item) => !item.value.trim()).length,
    }),
    [namespaces.length, translations]
  )

  function handleOpenModal(item?: Translation) {
    setFormError('')

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
        ...INITIAL_FORM,
        locale: currentLocale,
        namespace: selectedNamespace === '__all__' ? 'common' : selectedNamespace,
      })
    }

    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setIsModalOpen(false)
    setEditingItem(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formData.locale.trim() || !formData.namespace.trim() || !formData.key.trim()) {
      setFormError(t('requiredField'))
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/api/admin/translations', {
        locale: formData.locale.trim(),
        namespace: formData.namespace.trim(),
        key: formData.key.trim(),
        value: formData.value,
      })

      if (res.error) {
        setFormError(res.error)
        toast.error(res.error)
        return
      }

      toast.success(editingItem ? t('updateSuccess') : t('createSuccess'))
      setIsModalOpen(false)
      setEditingItem(null)

      if (formData.locale !== currentLocale) {
        setCurrentLocale(formData.locale)
      } else {
        await fetchTranslations()
      }
    } catch {
      setFormError(t('saveError'))
      toast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--color-primary)] text-[var(--color-on-primary)]">
              <Languages className="h-4 w-4" aria-hidden="true" />
            </span>
            <Badge variant="primary" className="uppercase">
              {currentLocale}
            </Badge>
          </div>
          <h1
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text-subtle)' }}>
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            aria-label={t('locale')}
            value={currentLocale}
            onChange={(event) => {
              setCurrentLocale(event.target.value)
              setSelectedNamespace('__all__')
            }}
            options={LOCALES}
            className="min-w-40"
          />
          <Button variant="secondary" onClick={() => fetchTranslations()} disabled={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('refresh')}
          </Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addKey')}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('totalKeys'), value: stats.total, icon: Type },
          { label: t('namespacesCount'), value: stats.namespaces, icon: Layers3 },
          { label: t('emptyValues'), value: stats.emptyValues, icon: AlertCircle },
          { label: t('currentLocale'), value: currentLocale.toUpperCase(), icon: Languages },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase text-[var(--color-text-faint)]">
                {item.label}
              </p>
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-surface-low)] text-[var(--color-primary)]">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-black text-[var(--color-primary)]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase text-[var(--color-primary)]">
                {t('tableDescription')}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {t('showingCount', { count: filteredData.length, total: translations.length })}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>
              <Select
                aria-label={t('namespaceFilter')}
                value={selectedNamespace}
                onChange={(event) => setSelectedNamespace(event.target.value)}
                options={[
                  { label: t('allNamespaces'), value: '__all__' },
                  ...namespaces.map((namespace) => ({
                    label: `${namespace} (${namespaceCounts[namespace] ?? 0})`,
                    value: namespace,
                  })),
                ]}
                className="sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('namespace')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('key')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('value')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('locale')}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
                  {tCommon('edit')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-56 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-12 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-8 w-8 animate-pulse rounded bg-[var(--color-surface-mid)]" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <AlertCircle className="mx-auto h-8 w-8 text-[var(--color-error)]" />
                      <p className="mt-3 text-sm font-bold text-[var(--color-text)]">{error}</p>
                      <Button
                        className="mt-4"
                        variant="secondary"
                        onClick={() => fetchTranslations()}
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        {t('refresh')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="mx-auto max-w-md">
                      <Languages className="mx-auto h-9 w-9 text-[var(--color-text-faint)]" />
                      <p className="mt-3 text-sm font-bold text-[var(--color-text)]">
                        {t('noResults')}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {t('noResultsDescription')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-[var(--color-surface-low)]/70"
                  >
                    <td className="px-4 py-4 align-top">
                      <Badge variant="neutral" className="max-w-48 truncate text-[10px]">
                        {item.namespace}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <code className="block max-w-[18rem] truncate text-xs font-bold text-[var(--color-info)]">
                        {item.key}
                      </code>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-muted)]">
                        {item.value || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant="primary" className="uppercase">
                        {item.locale}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${tCommon('edit')} ${item.key}`}
                        onClick={() => handleOpenModal(item)}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        is_open={isModalOpen}
        onClose={closeModal}
        title={editingItem ? t('editTitle') : t('addTitle')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            {editingItem ? t('editorHint') : t('valueHint')}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('locale')}
              value={formData.locale}
              onChange={(event) => setFormData({ ...formData, locale: event.target.value })}
              placeholder={t('localePlaceholder')}
              required
              disabled={!!editingItem || saving}
            />
            <Input
              label={t('namespace')}
              value={formData.namespace}
              onChange={(event) => setFormData({ ...formData, namespace: event.target.value })}
              placeholder={t('namespacePlaceholder')}
              required
              disabled={!!editingItem || saving}
            />
          </div>

          <Input
            label={t('key')}
            value={formData.key}
            onChange={(event) => setFormData({ ...formData, key: event.target.value })}
            placeholder={t('keyPlaceholder')}
            required
            disabled={!!editingItem || saving}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="translation-value"
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]"
              >
                {t('value')}
              </label>
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-faint)]">
                {t('valueLength', { count: formData.value.length })}
              </span>
            </div>
            <textarea
              id="translation-value"
              className="min-h-[180px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-6 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={formData.value}
              onChange={(event) => setFormData({ ...formData, value: event.target.value })}
              placeholder={t('valuePlaceholder')}
              required
              disabled={saving}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              {tCommon('cancel')}
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
