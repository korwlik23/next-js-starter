import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './config'

// ────────────────────────────────────────
// i18n Request Config — โหลด messages ตาม locale
// next-intl ใช้ไฟล์นี้ในการตั้งค่าภาษาสำหรับแต่ละ request
// ────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { deepMerge } from '@/utils/object'
import { unstable_cache } from 'next/cache'

// ฟังก์ชันดึงและแปลงข้อมูล Database เป็น Object แบบมี Nested (Cache ไว้)
const GetDbTranslations = unstable_cache(
  async (locale: string) => {
    try {
      const records = await prisma.translation.findMany({
        where: { locale },
      })
      
      const db_messages: Record<string, Record<string, string>> = {}
      for (const record of records) {
        if (!db_messages[record.namespace]) {
          db_messages[record.namespace] = {}
        }
        db_messages[record.namespace][record.key] = record.value
      }
      return db_messages
    } catch (err) {
      console.error('[i18n] Error fetching DB translations:', err)
      return {} // ถ้า DB ล่มให้โหลดจาก JSON แทน
    }
  },
  ['translations'], // cache key
  { tags: ['translations'], revalidate: 3600 } // invalidate tag
)

export default getRequestConfig(async () => {
  // อ่าน locale จาก cookie (ตั้งโดย LanguageSwitcher)
  const cookie_store = await cookies()
  const cookie_locale = cookie_store.get('locale')?.value as SupportedLocale | undefined

  // ตรวจสอบว่า locale ที่ได้มาอยู่ในรายการที่รองรับ
  const locale =
    cookie_locale && SUPPORTED_LOCALES.includes(cookie_locale) ? cookie_locale : DEFAULT_LOCALE

  // 1. ดึงข้อมูลจากไฟล์ JSON พื้นฐาน (Fallback)
  let base_messages = {}
  try {
    base_messages = (await import(`../../messages/${locale}.json`)).default
  } catch (err) {
    console.error(`[i18n] Missing ${locale}.json`)
  }

  // 2. ดึงข้อมูลจาก Database ผ่าน Cache
  const db_messages = await GetDbTranslations(locale)

  // 3. นำมา Merge โดยเอา DB ทับ JSON พื้นฐาน
  const merged_messages = deepMerge(base_messages, db_messages)

  return {
    locale,
    messages: merged_messages,
  }
})
