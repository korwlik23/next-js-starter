import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'
import { DEFAULT_LOCALE } from '@/i18n/config'
import enMessages from '../../../../messages/en.json'
import thMessages from '../../../../messages/th.json'

// ─────────────────────────────────────────
// ไฟล์ข้อความพื้นฐาน (bundled JSON)
// ─────────────────────────────────────────
// แคตตาล็อกฐานมาจากไฟล์ในโฟลเดอร์ messages/ ส่วนคำแปลที่แก้ผ่านหน้าผู้ดูแลระบบ
// เก็บเป็น override ในฐานข้อมูล ไฟล์นี้ดูแลเฉพาะฝั่งไฟล์

const BASE_MESSAGES_BY_LOCALE: Record<string, Record<string, unknown>> = {
  en: enMessages,
  th: thMessages,
}

export function normalizeLocaleCode(locale: string) {
  return locale.trim().toLowerCase()
}

/**
 * เส้นทางไฟล์ข้อความของภาษาหนึ่ง
 * ตรวจรูปแบบรหัสภาษาก่อนเสมอ เพื่อไม่ให้ค่าจากผู้ใช้พาออกนอกโฟลเดอร์ที่ตั้งใจ
 */
export function getMessagesFilePath(locale: string) {
  if (!/^[a-z]{2,5}(-[a-z0-9]{2,8})?$/.test(locale)) {
    throw new Error('INVALID_LOCALE')
  }

  return path.join(process.cwd(), 'messages', `${locale}.json`)
}

/** แปลงข้อความซ้อนชั้นให้เป็นรายการคู่ key/value แบบแบน */
export function flattenMessages(
  value: unknown,
  keyPath: string[] = []
): Array<{ key: string; value: string }> {
  if (typeof value === 'string') {
    return [{ key: keyPath.join('.'), value }]
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  return Object.entries(value).flatMap(([childKey, childValue]) =>
    flattenMessages(childValue, [...keyPath, childKey])
  )
}

/** อ่านข้อความจากไฟล์ คืน undefined เมื่อไม่มีไฟล์หรืออ่านไม่ได้ */
export function getStaticMessages(locale: string) {
  if (BASE_MESSAGES_BY_LOCALE[locale]) return BASE_MESSAGES_BY_LOCALE[locale]

  try {
    const filePath = getMessagesFilePath(locale)
    if (!existsSync(filePath)) return undefined
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  } catch (error) {
    logger.warn('[TranslationService] Failed to read locale message file', { locale, error })
    return undefined
  }
}

/** ข้อความพื้นฐานของภาษาหนึ่ง โดยไล่ fallback จนถึงภาษาเริ่มต้น */
export function getBaseMessages(locale: string, fallbackLocale: string = DEFAULT_LOCALE) {
  return (
    getStaticMessages(locale) ??
    getStaticMessages(fallbackLocale) ??
    getStaticMessages(DEFAULT_LOCALE) ??
    {}
  )
}

/** แคตตาล็อกฐานแบบแบน พร้อม namespace สำหรับเทียบกับ override ในฐานข้อมูล */
export function getBaseCatalog(locale: string, fallbackLocale: string = DEFAULT_LOCALE) {
  const messages = getBaseMessages(locale, fallbackLocale)

  return Object.entries(messages).flatMap(([namespace, namespaceMessages]) =>
    flattenMessages(namespaceMessages).map(({ key, value }) => ({
      locale,
      namespace,
      key,
      value,
    }))
  )
}

/** เขียนค่าลงในโครงสร้างซ้อนชั้นตาม namespace และ key ที่คั่นด้วยจุด */
export function setNestedTranslation(
  messages: Record<string, unknown>,
  namespace: string,
  key: string,
  value: string
) {
  const parts = [namespace, ...key.split('.').filter(Boolean)]
  let cursor = messages

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value
      return
    }

    const next = cursor[part]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[part] = {}
    }

    cursor = cursor[part] as Record<string, unknown>
  })
}
