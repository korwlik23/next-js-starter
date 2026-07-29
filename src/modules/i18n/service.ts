// ─────────────────────────────────────────
// I18N SERVICE — public entrypoint
// ─────────────────────────────────────────
// ไฟล์นี้เคยเป็น object เดียว 675 บรรทัด 21 เมธอด ครอบสี่เรื่องที่แยกจากกันได้
// (ทะเบียนภาษา+การตั้งค่า, แคตตาล็อกคำแปล, ข้อความจากไฟล์, แปลอัตโนมัติ)
// และยังอ่าน/เขียนไฟล์ปนอยู่ด้วย จึงถูกแยกตามขอบเขตไว้ใน ./internal
//
// TranslationService ยังคงรูปเดิมไว้เพื่อไม่ให้ผู้เรียกต้องแก้ import
// เพิ่มความสามารถใหม่ให้ไปที่ไฟล์ใน ./internal ไม่ใช่ที่นี่

import { autoTranslateMissing } from './internal/auto-translate'
import {
  deleteTranslation,
  getByLocale,
  getCatalogByLocale,
  getRuntimeDbMessages,
  isKnownKey,
  upsert,
} from './internal/catalog'
import { getBaseMessages } from './internal/messages'
import {
  createLocale,
  deleteLocale,
  ensureDefaults,
  ensureLocaleMessageFile,
  getAvailableLocales,
  getLocales,
  getRuntimeConfig,
  getSettings,
  isKnownLocale,
  updateSettings,
} from './internal/registry'

export {
  AVAILABLE_LANGUAGE_OPTIONS,
  type I18nSettingsInput,
  type LangMode,
  type LocaleInput,
  type TranslationCatalogItem,
  type TranslationInput,
  type TranslationSource,
  type TranslationStatus,
} from './internal/types'

export const TranslationService = {
  // ทะเบียนภาษาและการตั้งค่า
  ensureDefaults,
  getSettings,
  getLocales,
  getRuntimeConfig,
  updateSettings,
  createLocale,
  ensureLocaleMessageFile,
  deleteLocale,
  isKnownLocale,
  getAvailableLocales,

  // แคตตาล็อกคำแปล
  upsert,
  getByLocale,
  getCatalogByLocale,
  isKnownKey,
  getRuntimeDbMessages,
  getBaseMessages,
  delete: deleteTranslation,

  // แปลอัตโนมัติ
  autoTranslateMissing,
}
