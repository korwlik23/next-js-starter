import { prisma } from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'

// ────────────────────────────────────────
// Translation Service
// ────────────────────────────────────────

/**
 * ดึงข้อมูลคำแปลทั้งหมดหรือตามภาษาที่กำหนด
 */
export async function GetAllTranslations(locale?: string) {
  return await prisma.translation.findMany({
    where: locale ? { locale } : undefined,
    orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
  })
}

/**
 * เพิ่มหรืออัปเดตคำแปล (Upsert)
 */
interface UpsertTranslationInput {
  locale: string
  namespace: string
  key: string
  value: string
}

export async function UpsertTranslation(data: UpsertTranslationInput) {
  const { locale, namespace, key, value } = data

  return await prisma.translation.upsert({
    where: {
      locale_namespace_key: {
        locale,
        namespace,
        key,
      },
    },
    update: {
      value,
      status: 'published',
      source: 'manual',
      reviewedAt: new Date(),
    },
    create: {
      id: GenerateId(),
      locale,
      namespace,
      key,
      value,
      status: 'published',
      source: 'manual',
      reviewedAt: new Date(),
    },
  })
}
