import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────
// Translation Service — จัดการคำแปลใน Database
// รองรับการแก้ไขคำแปลแบบ Hot-fix และการเพิ่มภาษาใหม่
// ─────────────────────────────────────────────

export interface TranslationInput {
  locale: string
  namespace: string
  key: string
  value: string
}

export const TranslationService = {
  /**
   * บันทึกหรืออัปเดตคำแปล
   */
  async upsert(input: TranslationInput) {
    try {
      const translation = await prisma.translation.upsert({
        where: {
          locale_namespace_key: {
            locale: input.locale,
            namespace: input.namespace,
            key: input.key,
          },
        },
        update: { value: input.value },
        create: {
          id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          locale: input.locale,
          namespace: input.namespace,
          key: input.key,
          value: input.value,
        },
      })
      return translation
    } catch (error) {
      logger.error('[TranslationService] Failed to upsert translation', error)
      throw error
    }
  },

  /**
   * ดึงคำแปลทั้งหมดของ Locale นั้นๆ
   */
  async getByLocale(locale: string) {
    return prisma.translation.findMany({
      where: { locale },
      orderBy: { key: 'asc' },
    })
  },

  /**
   * ดึงรายชื่อภาษาที่มีอยู่ในระบบ
   */
  async getAvailableLocales() {
    const locales = await prisma.translation.findMany({
      select: { locale: true },
      distinct: ['locale'],
    })
    return locales.map((l) => l.locale)
  },

  /**
   * ลบคำแปล
   */
  async delete(locale: string, namespace: string, key: string) {
    return prisma.translation.delete({
      where: {
        locale_namespace_key: { locale, namespace, key },
      },
    })
  },
}
