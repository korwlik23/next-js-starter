'use client'

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
import { Button, Input, Modal, ConfirmModal, Badge, SelectMenu } from '@/components/ui'
import { ALL, STATUS_FILTERS } from './types'
import { useAutoTranslate } from './use-auto-translate'
import { useI18nConfig } from './use-i18n-config'
import { useTranslationCatalog } from './use-translation-catalog'
import { useTranslationEditor } from './use-translation-editor'

// หน้านี้เคยถือ state 22 ตัวและยิง 7 endpoint ในคอมโพเนนต์เดียว 855 บรรทัด
// ตอนนี้เหลือหน้าที่ประกอบ hook ตามความรับผิดชอบแล้วเรนเดอร์เท่านั้น
// ตรรกะและการเรียก API อยู่ในไฟล์ข้างเคียง

export default function TranslationsPage() {
  const t = useTranslations('translationsAdmin')
  const tCommon = useTranslations('common')

  const {
    translations,
    loading,
    error,
    currentLocale,
    setCurrentLocale,
    selectedNamespace,
    setSelectedNamespace,
    selectedStatus,
    setSelectedStatus,
    search,
    setSearch,
    fetchTranslations,
    namespaces,
    namespaceCounts,
    filteredData,
    stats,
  } = useTranslationCatalog('th', t('loadError'))

  const {
    i18nConfig,
    settingsDraft,
    setSettingsDraft,
    configLoading,
    settingsSaving,
    languageSaving,
    isLanguageModalOpen,
    setIsLanguageModalOpen,
    selectedLanguageCode,
    setSelectedLanguageCode,
    deletingLocale,
    setDeletingLocale,
    localeOptions,
    languageOptions,
    handleSaveSettings,
    handleCreateLanguage,
    handleDeleteLanguage,
  } = useI18nConfig({
    currentLocale,
    setCurrentLocale,
    onLanguageCreated: () => {
      setSelectedNamespace(ALL)
      setSelectedStatus('missing')
    },
    messages: {
      settingsLoadError: t('settingsLoadError'),
      settingsSaveError: t('settingsSaveError'),
      settingsSaved: t('settingsSaved'),
      languageCreateFailed: t('languageCreateFailed'),
      languageCreated: t('languageCreated'),
      languageDeleteFailed: t('languageDeleteFailed'),
      languageDeleted: t('languageDeleted'),
    },
  })

  const {
    isModalOpen,
    editingItem,
    translationValue,
    setTranslationValue,
    formError,
    saving,
    handleOpenModal,
    closeModal,
    handleSubmit,
  } = useTranslationEditor(
    {
      editOnlyHint: t('editOnlyHint'),
      requiredField: t('requiredField'),
      updateSuccess: t('updateSuccess'),
      saveError: t('saveError'),
    },
    () => fetchTranslations()
  )

  const { autoTranslating, handleAutoTranslate } = useAutoTranslate({
    locale: currentLocale,
    failedMessage: t('autoTranslateFailed'),
    buildCompleteMessage: ({ translated, skipped }) =>
      t('autoTranslateComplete', { translated, skipped }),
    onCompleted: async () => {
      setSelectedStatus('machine_translated')
      await fetchTranslations()
    },
  })

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
