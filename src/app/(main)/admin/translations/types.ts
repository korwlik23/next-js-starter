export interface Translation {
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

export interface LocaleRecord {
  code: string
  name: string
  nativeName: string
  enabled: boolean
  isDefault: boolean
  fallbackLocale: string | null
}

export interface I18nSettings {
  langMode: 'switch' | 'multi'
  defaultLocale: string
  switchLocaleA: string
  switchLocaleB: string
}

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

export interface I18nAdminPayload {
  settings: I18nSettings
  locales: LocaleRecord[]
  availableLocales: string[]
  languageOptions: LanguageOption[]
}

/** ค่าที่ใช้แทน "ทั้งหมด" ในตัวกรอง */
export const ALL = '__all__'

export const STATUS_FILTERS = [
  { labelKey: 'allStatuses', value: ALL },
  { labelKey: 'missingStatus', value: 'missing' },
  { labelKey: 'publishedStatus', value: 'published' },
  { labelKey: 'machineStatus', value: 'machine_translated' },
  { labelKey: 'jsonDefault', value: 'json' },
] as const

/** ใช้ระหว่างรอโหลดการตั้งค่าจริง เพื่อให้หน้าจอมีค่าตั้งต้นเสมอ */
export const FALLBACK_SETTINGS: I18nSettings = {
  langMode: 'switch',
  defaultLocale: 'th',
  switchLocaleA: 'th',
  switchLocaleB: 'en',
}
