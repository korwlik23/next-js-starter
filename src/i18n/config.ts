// ────────────────────────────────────────
// i18n Config — ค่าคงที่สำหรับระบบหลายภาษา
// ────────────────────────────────────────

/** รายการภาษาที่รองรับ */
export const SUPPORTED_LOCALES = ['en', 'th'] as const

/** ภาษาเริ่มต้น */
export const DEFAULT_LOCALE = 'th' as const

/** ชื่อภาษาสำหรับแสดงผลใน switcher */
export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  th: 'ไทย',
}

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
