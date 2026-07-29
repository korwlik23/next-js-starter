'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createLanguageRequest,
  deleteLanguageRequest,
  fetchI18nConfigRequest,
  saveI18nSettingsRequest,
} from './api'
import {
  FALLBACK_SETTINGS,
  type I18nAdminPayload,
  type I18nSettings,
  type LocaleRecord,
} from './types'

type Messages = {
  settingsLoadError: string
  settingsSaveError: string
  settingsSaved: string
  languageCreateFailed: string
  languageCreated: string
  languageDeleteFailed: string
  languageDeleted: string
}

type Options = {
  currentLocale: string
  setCurrentLocale: (locale: string) => void
  /** เรียกหลังเพิ่มภาษาใหม่สำเร็จ ใช้รีเซ็ตตัวกรองให้ชี้ไปที่คำแปลที่ยังขาด */
  onLanguageCreated?: () => void
  messages: Messages
}

/**
 * ทะเบียนภาษาและการตั้งค่าโหมดภาษา
 *
 * ทุก endpoint ในกลุ่มนี้คืน payload ชุดเต็มกลับมา จึงอัปเดต state จากคำตอบ
 * ได้เลยโดยไม่ต้องโหลดซ้ำ
 */
export function useI18nConfig({
  currentLocale,
  setCurrentLocale,
  onLanguageCreated,
  messages,
}: Options) {
  const [i18nConfig, setI18nConfig] = useState<I18nAdminPayload | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<I18nSettings>(FALLBACK_SETTINGS)
  const [configLoading, setConfigLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [languageSaving, setLanguageSaving] = useState(false)
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('')
  const [deletingLocale, setDeletingLocale] = useState<LocaleRecord | null>(null)

  const fetchI18nConfig = useCallback(async () => {
    setConfigLoading(true)
    const res = await fetchI18nConfigRequest()
    setConfigLoading(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? messages.settingsLoadError)
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)

    if (!res.data.locales.some((locale) => locale.code === currentLocale)) {
      setCurrentLocale(res.data.settings.defaultLocale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchI18nConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const selectedLanguage = useMemo(
    () => i18nConfig?.languageOptions.find((language) => language.code === selectedLanguageCode),
    [i18nConfig, selectedLanguageCode]
  )

  async function handleSaveSettings() {
    setSettingsSaving(true)
    const res = await saveI18nSettingsRequest(settingsDraft)
    setSettingsSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? messages.settingsSaveError)
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    toast.success(messages.settingsSaved)
  }

  async function handleCreateLanguage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLanguage) return

    setLanguageSaving(true)
    const res = await createLanguageRequest({
      code: selectedLanguage.code,
      name: selectedLanguage.name,
      nativeName: selectedLanguage.nativeName,
      enabled: true,
      fallbackLocale: settingsDraft.defaultLocale,
    })
    setLanguageSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? messages.languageCreateFailed)
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    setCurrentLocale(selectedLanguage.code)
    onLanguageCreated?.()
    setSelectedLanguageCode('')
    setIsLanguageModalOpen(false)
    toast.success(messages.languageCreated)
  }

  async function handleDeleteLanguage() {
    if (!deletingLocale) return

    setLanguageSaving(true)
    const res = await deleteLanguageRequest(deletingLocale.code)
    setLanguageSaving(false)

    if (res.error || !res.data) {
      toast.error(res.error ?? messages.languageDeleteFailed)
      return
    }

    setI18nConfig(res.data)
    setSettingsDraft(res.data.settings)
    if (currentLocale === deletingLocale.code) {
      setCurrentLocale(res.data.settings.defaultLocale)
    }
    setDeletingLocale(null)
    toast.success(messages.languageDeleted)
  }

  return {
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
  }
}
