export type LangMode = 'switch' | 'multi'
export type TranslationStatus = 'missing' | 'machine_translated' | 'reviewed' | 'published'
export type TranslationSource = 'manual' | 'machine' | 'imported'

export interface TranslationInput {
  locale: string
  namespace: string
  key: string
  value: string
  updatedBy?: string | null
}

export interface LocaleInput {
  code: string
  name: string
  nativeName: string
  enabled?: boolean
  fallbackLocale?: string | null
}

export interface I18nSettingsInput {
  langMode: LangMode
  defaultLocale: string
  switchLocaleA: string
  switchLocaleB: string
}

export interface TranslationCatalogItem {
  id: string
  locale: string
  namespace: string
  key: string
  value: string | null
  effectiveValue: string
  baseValue: string
  source: TranslationSource | 'json'
  status: TranslationStatus | 'json'
  isOverridden: boolean
}

/** ภาษาที่เลือกเพิ่มได้จากหน้าผู้ดูแลระบบ */
export const AVAILABLE_LANGUAGE_OPTIONS = [
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
]
