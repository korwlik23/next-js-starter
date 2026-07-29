import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { getCatalogByLocale } from './catalog'
import { hasSamePlaceholders } from './normalize'
import { getSettings } from './registry'
import { translateText } from './translate-client'

/**
 * แปล key ที่ยังขาดด้วยบริการภายนอก
 *
 * ผลลัพธ์ถูกบันทึกเป็น `machine_translated` ไม่ใช่ `published` จึงยังไม่ถูกนำไป
 * แสดงผลจนกว่าจะมีคนตรวจ และคำแปลที่ทำ placeholder หายจะถูกข้ามไป
 * เพื่อไม่ให้ข้อความพังตอนแทนค่า
 *
 * ความล้มเหลวรายรายการไม่หยุดทั้งชุด แต่ถูกนับไว้ในผลสรุป
 */
export async function autoTranslateMissing(locale: string, updatedBy?: string | null) {
  const settings = await getSettings()
  const localeRecord = await prisma.locale.findUnique({ where: { code: locale } })
  if (!localeRecord) throw new Error('LOCALE_NOT_FOUND')

  const sourceLocale = localeRecord.fallbackLocale ?? settings.defaultLocale
  const catalog = await getCatalogByLocale(locale)
  const missingItems = catalog.filter((item) => !item.value || item.status === 'missing')

  let translated = 0
  let skipped = 0

  for (const item of missingItems) {
    try {
      const translatedText = await translateText({
        text: item.baseValue,
        sourceLocale,
        targetLocale: locale,
      })

      if (!hasSamePlaceholders(item.baseValue, translatedText)) {
        skipped += 1
        continue
      }

      await prisma.translation.upsert({
        where: {
          locale_namespace_key: {
            locale,
            namespace: item.namespace,
            key: item.key,
          },
        },
        update: {
          value: translatedText,
          status: 'machine_translated',
          source: 'machine',
          updatedBy,
        },
        create: {
          id: GenerateId(),
          locale,
          namespace: item.namespace,
          key: item.key,
          value: translatedText,
          status: 'machine_translated',
          source: 'machine',
          updatedBy,
        },
      })
      translated += 1
    } catch (error) {
      logger.warn('[TranslationService] Auto translate skipped key', {
        locale,
        namespace: item.namespace,
        key: item.key,
        error,
      })
      skipped += 1
    }
  }

  return { translated, skipped, total: missingItems.length }
}
