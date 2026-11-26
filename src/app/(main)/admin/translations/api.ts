import { api } from '@/services/apiClient'
import type { I18nAdminPayload, I18nSettings, Translation } from './types'

// รวมทุก endpoint ที่หน้านี้เรียก ไว้ที่เดียว
// component จะได้ไม่ต้องรู้ path หรือรูปแบบ query string

export function fetchI18nConfigRequest() {
  return api.get<I18nAdminPayload>('/api/admin/i18n')
}

export function fetchTranslationsRequest(locale: string) {
  return api.get<Translation[]>(`/api/admin/translations?locale=${encodeURIComponent(locale)}`)
}

export function saveTranslationRequest(input: {
  locale: string
  namespace: string
  key: string
  value: string
}) {
  return api.post('/api/admin/translations', input)
}

export function saveI18nSettingsRequest(settings: I18nSettings) {
  return api.patch<I18nAdminPayload>('/api/admin/i18n', settings)
}

export function createLanguageRequest(input: {
  code: string
  name: string
  nativeName: string
  enabled: boolean
  fallbackLocale: string
}) {
  return api.post<I18nAdminPayload>('/api/admin/i18n', input)
}

export function deleteLanguageRequest(code: string) {
  return api.delete<I18nAdminPayload>(`/api/admin/i18n?code=${encodeURIComponent(code)}`)
}

export function autoTranslateRequest(locale: string) {
  return api.post<{ translated: number; skipped: number; total: number }>(
    '/api/admin/i18n/auto-translate',
    { locale }
  )
}
