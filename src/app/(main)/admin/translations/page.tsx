'use client'

import { useTranslations } from 'next-intl'
import { ALL } from './types'
import { Header } from './components/Header'
import { LanguageSettings } from './components/LanguageSettings'
import { Stats } from './components/Stats'
import { TranslationModals } from './components/TranslationModals'
import { TranslationTable } from './components/TranslationTable'
import { useAutoTranslate } from './use-auto-translate'
import { useI18nConfig } from './use-i18n-config'
import { useTranslationCatalog } from './use-translation-catalog'
import { useTranslationEditor } from './use-translation-editor'

export default function TranslationsPage() {
  const t = useTranslations('translationsAdmin')

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
      <Header
        currentLocale={currentLocale}
        setCurrentLocale={setCurrentLocale}
        setSelectedNamespace={setSelectedNamespace}
        setSelectedStatus={setSelectedStatus}
        localeOptions={localeOptions}
        loading={loading}
        fetchTranslations={fetchTranslations}
        autoTranslating={autoTranslating}
        missingTranslations={stats.missing}
        handleAutoTranslate={handleAutoTranslate}
        setIsLanguageModalOpen={setIsLanguageModalOpen}
      />

      <LanguageSettings
        i18nConfig={i18nConfig}
        settingsDraft={settingsDraft}
        setSettingsDraft={setSettingsDraft}
        configLoading={configLoading}
        settingsSaving={settingsSaving}
        languageSaving={languageSaving}
        localeOptions={localeOptions}
        handleSaveSettings={handleSaveSettings}
        setDeletingLocale={setDeletingLocale}
      />

      <Stats stats={stats} />

      <TranslationTable
        translations={translations}
        loading={loading}
        error={error}
        selectedNamespace={selectedNamespace}
        setSelectedNamespace={setSelectedNamespace}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        search={search}
        setSearch={setSearch}
        fetchTranslations={fetchTranslations}
        namespaces={namespaces}
        namespaceCounts={namespaceCounts}
        filteredData={filteredData}
        handleOpenModal={handleOpenModal}
      />

      <TranslationModals
        isModalOpen={isModalOpen}
        editingItem={editingItem}
        translationValue={translationValue}
        setTranslationValue={setTranslationValue}
        formError={formError}
        saving={saving}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
        isLanguageModalOpen={isLanguageModalOpen}
        setIsLanguageModalOpen={setIsLanguageModalOpen}
        selectedLanguageCode={selectedLanguageCode}
        setSelectedLanguageCode={setSelectedLanguageCode}
        languageOptions={languageOptions}
        languageSaving={languageSaving}
        handleCreateLanguage={handleCreateLanguage}
        deletingLocale={deletingLocale}
        setDeletingLocale={setDeletingLocale}
        handleDeleteLanguage={handleDeleteLanguage}
      />
    </div>
  )
}
