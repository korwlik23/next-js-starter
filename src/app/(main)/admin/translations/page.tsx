'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  Edit3,
  Globe2,
  Languages,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Input, Modal, ConfirmModal, Badge, SelectMenu } from '@/components/ui'
import { api } from '@/services/apiClient'

interface Translation {
  id: string
  locale: string
  namespace: string
  key: string
  value: string | null
  effectiveValue: string
  baseValue: string
  source: 'manual' | 'machine' | 'imported' | 'json'
  status: 'missing' | 'machine_translated' | 'reviewed' | 'published' | 'json'
  isOverridden: boolean
}

interface LocaleRecord {
  code: string
  name: string
  nativeName: string
  enabled: boolean
  isDefault: boolean
  fallbackLocale: string | null
}

interface I18nSettings {
  langMode: 'switch' | 'multi'
  defaultLocale: string
  switchLocaleA: string
  switchLocaleB: string
}

interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

interface I18nAdminPayload {
  settings: I18nSettings
  locales: LocaleRecord[]
  availableLocales: string[]
  languageOptions: LanguageOption[]
}

const ALL = '__all__'

const STATUS_FILTERS = [
  { labelKey: 'allStatuses', value: ALL },
  { labelKey: 'missingStatus', value: 'missing' },
  { labelKey: 'publishedStatus', value: 'published' },
  { labelKey: 'machineStatus', value: 'machine_translated' },
  { labelKey: 'jsonDefault', value: 'json' },
] as const

const FALLBACK_SETTINGS: I18nSettings = {
  langMode: 'switch',
  defaultLocale: 'th',
  switchLocaleA: 'th',
  switchLocaleB: 'en',
}

export default function TranslationsPage() {
  const t = useTranslations('translationsAdmin')
  const tCommon = useTranslations('common')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [i18nConfig, setI18nConfig] = useState<I18nAdminPayload | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<I18nSettings>(FALLBACK_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [languageSaving, setLanguageSaving] = useState(false)
  const [autoTranslating, setAutoTranslating] = useState(false)
  const [error, setError] = useState('')
  const [currentLocale, setCurrentLocale] = useState('th')
  const [selectedNamespace, setSelectedNamespace] = useState(ALL)
  const [selectedStatus, setSelectedStatus] = useState(ALL)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [deletingLocale, setDeletingLocale] = useState<LocaleRecord | null>(null)
  const [editingItem, setEditingItem] = useState<Translation | null>(null)
  const [formError, setFormError] = useState('')
  const [translationValue, setTranslationValue] = useState('')
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('')

  async function fetchI18nConfig() {
    setConfigLoading(true)
    const res = await api.get<I18nAdminPayload>('/api/admin/i18n')
    setConfigLoading(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? t('settingsLoadError'))
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)

    if (!res.data.locales.some((locale) => locale.code === currentLocale)) {
      setCurrentLocale(res.data.settings.defaultLocale)
    }
  }

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
    fetchI18nConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchTranslations(currentLocale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale])

  const localeOptions = useMemo(() => {
    const locales = i18nConfig?.locales ?? [
      { code: 'th', nativeName: 'ไทย', name: 'Thai', enabled: true },
      { code: 'en', nativeName: 'English', name: 'English', enabled: true },
    ]

    return locales
      .filter((locale) => locale.enabled)
      .map((locale) => ({
        label: `${locale.nativeName} (${locale.code})`,
        value: locale.code,
      }))
  }, [i18nConfig])

  const languageOptions = useMemo(() => {
    const existingCodes = new Set(i18nConfig?.locales.map((locale) => locale.code) ?? [])
    return (i18nConfig?.languageOptions ?? [])
      .filter((language) => !existingCodes.has(language.code))
      .map((language) => ({
        label: `${language.nativeName} (${language.name})`,
        value: language.code,
      }))
  }, [i18nConfig])

  const selectedLanguage = useMemo(() => {
    return i18nConfig?.languageOptions.find((language) => language.code === selectedLanguageCode)
  }, [i18nConfig, selectedLanguageCode])

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
      const matchesNamespace = selectedNamespace === ALL || item.namespace === selectedNamespace
      const matchesStatus = selectedStatus === ALL || item.status === selectedStatus
      const matchesSearch =
        !query ||
        item.key.toLowerCase().includes(query) ||
        item.effectiveValue.toLowerCase().includes(query) ||
        item.baseValue.toLowerCase().includes(query) ||
        item.namespace.toLowerCase().includes(query)

      return matchesNamespace && matchesStatus && matchesSearch
    })
  }, [search, selectedNamespace, selectedStatus, translations])

  const stats = useMemo(
    () => ({
      total: translations.length,
      namespaces: namespaces.length,
      missing: translations.filter((item) => item.status === 'missing').length,
      published: translations.filter((item) => item.status === 'published').length,
    }),
    [namespaces.length, translations]
  )

  function handleOpenModal(item: Translation) {
    setFormError('')
    setEditingItem(item)
    setTranslationValue(item.value ?? '')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setIsModalOpen(false)
    setEditingItem(null)
    setFormError('')
    setTranslationValue('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!editingItem) {
      setFormError(t('editOnlyHint'))
      return
    }
    if (!translationValue.trim()) {
      setFormError(t('requiredField'))
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/api/admin/translations', {
        locale: editingItem.locale,
        namespace: editingItem.namespace,
        key: editingItem.key,
        value: translationValue,
      })

      if (res.error) {
        setFormError(res.error)
        toast.error(res.error)
        return
      }

      toast.success(t('updateSuccess'))
      setIsModalOpen(false)
      setEditingItem(null)
      setFormError('')
      setTranslationValue('')
      await fetchTranslations()
    } catch {
      setFormError(t('saveError'))
      toast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSettings() {
    setSettingsSaving(true)
    const res = await api.patch<I18nAdminPayload>('/api/admin/i18n', settingsDraft)
    setSettingsSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? t('settingsSaveError'))
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    toast.success(t('settingsSaved'))
  }

  async function handleCreateLanguage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLanguage) return

    setLanguageSaving(true)
    const res = await api.post<I18nAdminPayload>('/api/admin/i18n', {
      code: selectedLanguage.code,
      name: selectedLanguage.name,
      nativeName: selectedLanguage.nativeName,
      enabled: true,
      fallbackLocale: settingsDraft.defaultLocale,
    })
    setLanguageSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? t('languageCreateFailed'))
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    setCurrentLocale(selectedLanguage.code)
    setSelectedNamespace(ALL)
    setSelectedStatus('missing')
    setSelectedLanguageCode('')
    setIsLanguageModalOpen(false)
    toast.success(t('languageCreated'))
  }

  async function handleDeleteLanguage() {
    if (!deletingLocale) return

    setLanguageSaving(true)
    const res = await api.delete<I18nAdminPayload>(
      `/api/admin/i18n?code=${encodeURIComponent(deletingLocale.code)}`
    )
    setLanguageSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? t('languageDeleteFailed'))
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    if (currentLocale === deletingLocale.code) {
      setCurrentLocale(res.data.settings.defaultLocale)
    }
    setDeletingLocale(null)
    toast.success(t('languageDeleted'))
  }

  async function handleAutoTranslate() {
    setAutoTranslating(true)
    const res = await api.post<{ translated: number; skipped: number; total: number }>(
      '/api/admin/i18n/auto-translate',
      { locale: currentLocale }
    )
    setAutoTranslating(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? t('autoTranslateFailed'))
      return
    }

    toast.success(
      t('autoTranslateComplete', {
        translated: res.data.translated,
        skipped: res.data.skipped,
      })
    )
    setSelectedStatus('machine_translated')
    await fetchTranslations()
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
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-primary)] sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-subtle)]">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SelectMenu
            aria-label={t('locale')}
            value={currentLocale}
            onValueChange={(nextLocale) => {
              setCurrentLocale(nextLocale)
              setSelectedNamespace(ALL)
              setSelectedStatus(ALL)
            }}
            options={localeOptions}
            className="min-w-48"
          />
          <Button variant="secondary" onClick={() => fetchTranslations()} disabled={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('refresh')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleAutoTranslate}
            disabled={autoTranslating || stats.missing === 0}
            isLoading={autoTranslating}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('autoTranslate')}
          </Button>
          <Button variant="primary" onClick={() => setIsLanguageModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addLanguage')}
          </Button>
        </div>
      </header>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-sm font-black uppercase text-[var(--color-primary)]">
                {t('languageSettings')}
              </h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {t('languageSettingsDescription')}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            <SelectMenu
              label={t('languageMode')}
              value={settingsDraft.langMode}
              onValueChange={(nextMode) =>
                setSettingsDraft({
                  ...settingsDraft,
                  langMode: nextMode === 'multi' ? 'multi' : 'switch',
                })
              }
              options={[
                { label: t('switchMode'), value: 'switch' },
                { label: t('multiMode'), value: 'multi' },
              ]}
              disabled={configLoading || settingsSaving}
            />
            <SelectMenu
              label={t('defaultLocale')}
              value={settingsDraft.defaultLocale}
              onValueChange={(nextLocale) =>
                setSettingsDraft({ ...settingsDraft, defaultLocale: nextLocale })
              }
              options={localeOptions}
              disabled={configLoading || settingsSaving}
            />
            <SelectMenu
              label={t('switchLocaleA')}
              value={settingsDraft.switchLocaleA}
              onValueChange={(nextLocale) =>
                setSettingsDraft({ ...settingsDraft, switchLocaleA: nextLocale })
              }
              options={localeOptions}
              disabled={configLoading || settingsSaving}
            />
            <SelectMenu
              label={t('switchLocaleB')}
              value={settingsDraft.switchLocaleB}
              onValueChange={(nextLocale) =>
                setSettingsDraft({ ...settingsDraft, switchLocaleB: nextLocale })
              }
              options={localeOptions}
              disabled={configLoading || settingsSaving}
            />
            <Button
              className="min-w-40 self-end"
              variant="primary"
              onClick={handleSaveSettings}
              isLoading={settingsSaving}
            >
              {t('saveSettings')}
            </Button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
              {t('activeLanguages')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(i18nConfig?.locales ?? []).map((locale) => {
                const cannotDelete = locale.code === 'en' || locale.isDefault
                return (
                  <div
                    key={locale.code}
                    className="inline-flex min-h-9 items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]"
                  >
                    <span className="px-3 text-xs font-bold text-[var(--color-text)]">
                      {locale.nativeName} ({locale.code})
                    </span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center border-l border-[var(--color-border)] text-[var(--color-text-faint)] transition hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-faint)]"
                      aria-label={`${t('deleteLanguage')} ${locale.code}`}
                      disabled={cannotDelete || languageSaving}
                      onClick={() => setDeletingLocale(locale)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('totalKeys'), value: stats.total, icon: Type },
          { label: t('namespacesCount'), value: stats.namespaces, icon: Layers3 },
          { label: t('missingValues'), value: stats.missing, icon: AlertCircle },
          { label: t('publishedValues'), value: stats.published, icon: Globe2 },
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
              <SelectMenu
                aria-label={t('namespaceFilter')}
                value={selectedNamespace}
                onValueChange={setSelectedNamespace}
                options={[
                  { label: t('allNamespaces'), value: ALL },
                  ...namespaces.map((namespace) => ({
                    label: `${namespace} (${namespaceCounts[namespace] ?? 0})`,
                    value: namespace,
                  })),
                ]}
                className="sm:w-64"
              />
              <SelectMenu
                aria-label={t('statusFilter')}
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                options={STATUS_FILTERS.map((item) => ({
                  label: t(item.labelKey),
                  value: item.value,
                }))}
                className="sm:w-56"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
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
                  {t('status')}
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
                      <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-surface-mid)]" />
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
                        {item.value || item.effectiveValue || '-'}
                      </p>
                      {(!item.value || item.baseValue !== item.value) && (
                        <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words border-l-2 border-[var(--color-border)] pl-3 text-xs leading-5 text-[var(--color-text-faint)]">
                          {t('baseValue')}: {item.baseValue}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Badge
                        variant={
                          item.status === 'missing'
                            ? 'warning'
                            : item.status === 'published'
                              ? 'success'
                              : 'outline'
                        }
                      >
                        {t(`${item.status}Label`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${tCommon('edit')} ${item.namespace}.${item.key}`}
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

      <Modal is_open={isModalOpen} onClose={closeModal} title={t('editTitle')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <p className="text-xs leading-5 text-[var(--color-text-muted)]">{t('editorHint')}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('locale')} value={editingItem?.locale ?? ''} disabled />
            <Input label={t('namespace')} value={editingItem?.namespace ?? ''} disabled />
          </div>

          <Input label={t('key')} value={editingItem?.key ?? ''} disabled />

          {editingItem && (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-low)] p-3">
              <p className="text-[10px] font-black uppercase text-[var(--color-text-faint)]">
                {t('baseValue')}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--color-text-muted)]">
                {editingItem.baseValue}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="translation-value"
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]"
              >
                {t('value')}
              </label>
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-faint)]">
                {t('valueLength', { count: translationValue.length })}
              </span>
            </div>
            <textarea
              id="translation-value"
              className="min-h-[180px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-6 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={translationValue}
              onChange={(event) => setTranslationValue(event.target.value)}
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

      <Modal
        is_open={isLanguageModalOpen}
        onClose={() => !languageSaving && setIsLanguageModalOpen(false)}
        title={t('addLanguage')}
        size="md"
      >
        <form onSubmit={handleCreateLanguage} className="space-y-5">
          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            {t('addLanguageDescription')}
          </p>
          <SelectMenu
            label={t('language')}
            value={selectedLanguageCode}
            onValueChange={setSelectedLanguageCode}
            options={[{ label: t('selectLanguage'), value: '' }, ...languageOptions]}
            disabled={languageSaving}
          />
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-low)] p-3">
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              {t('missingRowsCreated')}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsLanguageModalOpen(false)}
              disabled={languageSaving}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={languageSaving}
              disabled={!selectedLanguageCode}
            >
              {t('createLanguage')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        is_open={!!deletingLocale}
        onClose={() => !languageSaving && setDeletingLocale(null)}
        onConfirm={handleDeleteLanguage}
        title={t('deleteLanguageTitle')}
        message={t('deleteLanguageMessage', {
          locale: deletingLocale ? `${deletingLocale.nativeName} (${deletingLocale.code})` : '',
        })}
        confirm_text={t('deleteLanguage')}
        cancel_text={tCommon('cancel')}
        is_loading={languageSaving}
        variant="danger"
      />
    </div>
  )
}
