import type { LangMode, TranslationSource, TranslationStatus } from './types'

// ค่าจากฐานข้อมูลเก็บเป็น string จึงต้องแปลงกลับเป็นชนิดที่รู้จักก่อนใช้เสมอ
// ค่าที่ไม่รู้จักถูกปรับเป็นค่าที่ปลอดภัยที่สุดแทนการโยน error
// เพื่อไม่ให้ข้อมูลเก่าหรือข้อมูลที่นำเข้ามาทำให้หน้าจอทั้งหน้าใช้ไม่ได้

export function normalizeLangMode(value: string): LangMode {
  return value === 'multi' ? 'multi' : 'switch'
}

export function normalizeStatus(value: string): TranslationStatus {
  if (
    value === 'missing' ||
    value === 'machine_translated' ||
    value === 'reviewed' ||
    value === 'published'
  ) {
    return value
  }
  return 'published'
}

export function normalizeSource(value: string): TranslationSource {
  if (value === 'machine' || value === 'imported' || value === 'manual') return value
  return 'manual'
}

/** คีย์รวมสำหรับเทียบรายการแคตตาล็อกกับ override */
export function translationIdentity(namespace: string, key: string) {
  return `${namespace}.${key}`
}

function extractPlaceholders(value: string) {
  return Array.from(value.matchAll(/\{[a-zA-Z0-9_.-]+\}/g))
    .map((match) => match[0])
    .sort()
}

/**
 * เทียบว่า placeholder ของต้นฉบับกับคำแปลตรงกันหรือไม่
 * ใช้กันคำแปลอัตโนมัติที่ทำ placeholder หายหรือเพี้ยน ซึ่งจะทำให้ข้อความพังตอนแสดงผล
 */
export function hasSamePlaceholders(source: string, translated: string) {
  return extractPlaceholders(source).join('|') === extractPlaceholders(translated).join('|')
}
