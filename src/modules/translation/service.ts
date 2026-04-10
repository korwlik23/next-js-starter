import { prisma } from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { Translation } from '@prisma/client'

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
export async function UpsertTranslation(data: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>) {
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
    },
    create: {
      id: GenerateId(),
      locale,
      namespace,
      key,
      value,
    },
  })
}
