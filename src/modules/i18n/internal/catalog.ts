import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { getBaseCatalog, setNestedTranslation } from './messages'
import { normalizeSource, normalizeStatus, translationIdentity } from './normalize'
import { getSettings } from './registry'
import type { TranslationCatalogItem, TranslationInput } from './types'

// ─────────────────────────────────────────
// TRANSLATION CATALOG
// ─────────────────────────────────────────
// แคตตาล็อกที่ผู้ใช้เห็น = ข้อความฐานจากไฟล์ JSON ทับด้วย override ในฐานข้อมูล
// ไฟล์ JSON เป็นตัวกำหนดว่ามี key อะไรบ้าง ฐานข้อมูลกำหนดว่าค่าปัจจุบันคืออะไร

/** บันทึกคำแปลที่แก้ด้วยมือ ถือเป็น published ทันที */
export async function upsert(input: TranslationInput) {
  try {
    return await prisma.translation.upsert({
      where: {
        locale_namespace_key: {
          locale: input.locale,
          namespace: input.namespace,
          key: input.key,
        },
      },
      update: {
        value: input.value,
        status: 'published',
        source: 'manual',
        reviewedAt: new Date(),
        updatedBy: input.updatedBy,
      },
      create: {
        id: GenerateId(),
        locale: input.locale,
        namespace: input.namespace,
        key: input.key,
        value: input.value,
        status: 'published',
        source: 'manual',
        reviewedAt: new Date(),
        updatedBy: input.updatedBy,
      },
    })
  } catch (error) {
    logger.error('[TranslationService] Failed to upsert translation', error)
    throw error
  }
}

export async function getByLocale(locale: string) {
  return prisma.translation.findMany({
    where: { locale },
    orderBy: { key: 'asc' },
  })
}

/**
 * รวมข้อความฐานเข้ากับ override แล้วคืนสถานะของแต่ละ key
 *
 * override ที่มีค่าและไม่ได้อยู่สถานะ missing เท่านั้นจึงจะถูกใช้จริง
 * ทำให้แถวที่สร้างไว้ล่วงหน้าตอนเพิ่มภาษาไม่บังข้อความฐาน
 */
export async function getCatalogByLocale(locale: string): Promise<TranslationCatalogItem[]> {
  const localeRecord = await prisma.locale.findUnique({ where: { code: locale } })
  const settings = await getSettings()
  const fallbackLocale = localeRecord?.fallbackLocale ?? settings.defaultLocale
  const baseCatalog = getBaseCatalog(locale, fallbackLocale)

  const overrides = await prisma.translation.findMany({
    where: { locale },
    orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
  })
  const overrideMap = new Map(
    overrides.map((item) => [translationIdentity(item.namespace, item.key), item])
  )

  return baseCatalog
    .map((item) => {
      const override = overrideMap.get(translationIdentity(item.namespace, item.key))
      const value = override?.value ?? null
      const status = override ? normalizeStatus(override.status) : ('json' as const)
      const source = override ? normalizeSource(override.source) : ('json' as const)
      const isUsableOverride = Boolean(value && status !== 'missing')

      return {
        id: override?.id ?? `${item.locale}:${item.namespace}:${item.key}`,
        locale: item.locale,
        namespace: item.namespace,
        key: item.key,
        value,
        effectiveValue: isUsableOverride ? value! : item.value,
        baseValue: item.value,
        source,
        status,
        isOverridden: Boolean(override && value),
      }
    })
    .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key))
}

/** key นี้มีอยู่ในแคตตาล็อกฐานหรือไม่ */
export function isKnownKey(
  locale: string,
  namespace: string,
  key: string,
  fallbackLocale = DEFAULT_LOCALE
) {
  return getBaseCatalog(locale, fallbackLocale).some(
    (item) => item.namespace === namespace && item.key === key
  )
}

/**
 * ข้อความที่พร้อมใช้ตอน runtime — เฉพาะ override ที่ published หรือ reviewed
 * คำแปลจากเครื่องที่ยังไม่ตรวจจะไม่ถูกส่งออกไปแสดงผล
 */
export async function getRuntimeDbMessages(locale: string) {
  const records = await prisma.translation.findMany({
    where: {
      locale,
      value: { not: null },
      status: { in: ['published', 'reviewed'] },
    },
  })

  const messages: Record<string, unknown> = {}
  for (const record of records) {
    if (record.value) {
      setNestedTranslation(messages, record.namespace, record.key, record.value)
    }
  }

  return messages
}

export async function deleteTranslation(locale: string, namespace: string, key: string) {
  return prisma.translation.delete({
    where: {
      locale_namespace_key: { locale, namespace, key },
    },
  })
}
