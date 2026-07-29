import { existsSync } from 'fs'
import { copyFile, unlink } from 'fs/promises'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { getBaseCatalog, getMessagesFilePath, getStaticMessages, normalizeLocaleCode } from './messages'
import { normalizeLangMode } from './normalize'
import type { I18nSettingsInput, LocaleInput } from './types'

// ─────────────────────────────────────────
// LOCALE REGISTRY + SETTINGS
// ─────────────────────────────────────────
// ทะเบียนภาษาและการตั้งค่าโหมดภาษาอยู่ด้วยกันเพราะผูกกันจริง:
// การตั้งค่าอ้างถึงภาษาที่เปิดใช้ และการลบภาษาต้องย้ายการตั้งค่าตาม

const LOCALE_CODE_PATTERN = /^[a-z]{2,5}(-[a-z0-9]{2,8})?$/

/** สร้างภาษาเริ่มต้นและการตั้งค่าเริ่มต้นแบบ idempotent */
export async function ensureDefaults() {
  const now = new Date()

  await prisma.$transaction([
    prisma.locale.upsert({
      where: { code: 'th' },
      update: {
        name: 'Thai',
        nativeName: 'ไทย',
        enabled: true,
        isDefault: true,
        fallbackLocale: null,
      },
      create: {
        code: 'th',
        name: 'Thai',
        nativeName: 'ไทย',
        enabled: true,
        isDefault: true,
      },
    }),
    prisma.locale.upsert({
      where: { code: 'en' },
      update: {
        name: 'English',
        nativeName: 'English',
        enabled: true,
        fallbackLocale: 'th',
      },
      create: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        enabled: true,
        fallbackLocale: 'th',
      },
    }),
    prisma.i18nSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        langMode: 'switch',
        defaultLocale: 'th',
        switchLocaleA: 'th',
        switchLocaleB: 'en',
        createdAt: now,
        updatedAt: now,
      },
    }),
  ])
}

export async function getSettings() {
  const settings = await prisma.i18nSetting.findUnique({ where: { id: 'global' } })

  if (settings) {
    return {
      id: settings.id,
      langMode: normalizeLangMode(settings.langMode),
      defaultLocale: settings.defaultLocale,
      switchLocaleA: settings.switchLocaleA,
      switchLocaleB: settings.switchLocaleB,
    }
  }

  await ensureDefaults()
  return {
    id: 'global',
    langMode: 'switch' as const,
    defaultLocale: DEFAULT_LOCALE,
    switchLocaleA: 'th',
    switchLocaleB: 'en',
  }
}

export async function getLocales(options: { enabledOnly?: boolean } = {}) {
  const where = options.enabledOnly ? { enabled: true } : undefined
  const orderBy = [{ isDefault: 'desc' as const }, { code: 'asc' as const }]

  const locales = await prisma.locale.findMany({ where, orderBy })
  if (locales.length > 0) return locales

  await ensureDefaults()
  return prisma.locale.findMany({ where, orderBy })
}

export async function getRuntimeConfig() {
  const [settings, locales] = await Promise.all([getSettings(), getLocales({ enabledOnly: true })])

  const enabledLocales = locales.map((locale) => locale.code)
  const switchLocales = [settings.switchLocaleA, settings.switchLocaleB].filter((locale) =>
    enabledLocales.includes(locale)
  )

  return {
    settings,
    locales,
    availableLocales: settings.langMode === 'switch' ? switchLocales : enabledLocales,
  }
}

/**
 * แก้การตั้งค่าโหมดภาษา
 * ตรวจก่อนว่าภาษาที่อ้างถึงยังเปิดใช้อยู่ ไม่งั้นระบบจะชี้ไปยังภาษาที่ผู้ใช้เลือกไม่ได้
 */
export async function updateSettings(input: I18nSettingsInput) {
  const locales = await getLocales({ enabledOnly: true })
  const enabledLocaleCodes = new Set(locales.map((locale) => locale.code))

  if (!enabledLocaleCodes.has(input.defaultLocale)) {
    throw new Error('DEFAULT_LOCALE_DISABLED')
  }
  if (!enabledLocaleCodes.has(input.switchLocaleA) || !enabledLocaleCodes.has(input.switchLocaleB)) {
    throw new Error('SWITCH_LOCALE_DISABLED')
  }
  if (input.switchLocaleA === input.switchLocaleB) {
    throw new Error('SWITCH_LOCALE_DUPLICATE')
  }

  await prisma.$transaction([
    prisma.locale.updateMany({ data: { isDefault: false } }),
    prisma.locale.update({
      where: { code: input.defaultLocale },
      data: { isDefault: true, enabled: true },
    }),
    prisma.i18nSetting.upsert({
      where: { id: 'global' },
      update: {
        langMode: input.langMode,
        defaultLocale: input.defaultLocale,
        switchLocaleA: input.switchLocaleA,
        switchLocaleB: input.switchLocaleB,
      },
      create: {
        id: 'global',
        langMode: input.langMode,
        defaultLocale: input.defaultLocale,
        switchLocaleA: input.switchLocaleA,
        switchLocaleB: input.switchLocaleB,
      },
    }),
  ])

  return getRuntimeConfig()
}

/** คัดลอกไฟล์ข้อความจาก en เป็นจุดตั้งต้นเมื่อภาษายังไม่มีไฟล์ของตัวเอง */
export async function ensureLocaleMessageFile(locale: string) {
  const code = normalizeLocaleCode(locale)
  if (code === 'en') return

  const targetPath = getMessagesFilePath(code)
  if (existsSync(targetPath)) return

  await copyFile(getMessagesFilePath('en'), targetPath)
}

/**
 * เพิ่มภาษาใหม่ พร้อมสร้างรายการคำแปลว่างครบทุก key จากแคตตาล็อกฐาน
 * เพื่อให้หน้าจัดการคำแปลเห็นรายการที่ยังขาดได้ทันที
 */
export async function createLocale(input: LocaleInput) {
  const code = normalizeLocaleCode(input.code)
  if (!LOCALE_CODE_PATTERN.test(code)) {
    throw new Error('INVALID_LOCALE')
  }

  await ensureLocaleMessageFile(code)

  const fallbackLocale = input.fallbackLocale ?? (code === 'en' ? null : 'en')
  const baseCatalog = getBaseCatalog(code, fallbackLocale ?? 'en')

  return prisma.$transaction(async (tx) => {
    const createdLocale = await tx.locale.upsert({
      where: { code },
      update: {
        name: input.name.trim(),
        nativeName: input.nativeName.trim(),
        enabled: input.enabled ?? true,
        fallbackLocale,
      },
      create: {
        code,
        name: input.name.trim(),
        nativeName: input.nativeName.trim(),
        enabled: input.enabled ?? true,
        fallbackLocale,
      },
    })

    if (baseCatalog.length > 0) {
      await tx.translation.createMany({
        data: baseCatalog.map((item) => ({
          id: GenerateId(),
          locale: code,
          namespace: item.namespace,
          key: item.key,
          value: null,
          status: 'missing',
          source: 'manual',
        })),
        skipDuplicates: true,
      })
    }

    return createdLocale
  })
}

/**
 * ลบภาษา พร้อมย้ายการตั้งค่าที่ยังชี้มาที่ภาษานี้ไปยังภาษาที่ยังเปิดใช้อยู่
 * ภาษา `en` และภาษาเริ่มต้นลบไม่ได้ เพราะเป็นปลายทางของ fallback
 */
export async function deleteLocale(locale: string) {
  const code = normalizeLocaleCode(locale)
  if (code === 'en') throw new Error('CANNOT_DELETE_EN')

  const settings = await getSettings()
  if (code === settings.defaultLocale) throw new Error('CANNOT_DELETE_DEFAULT_LOCALE')

  await prisma.$transaction(async (tx) => {
    await tx.translation.deleteMany({ where: { locale: code } })
    await tx.locale.delete({ where: { code } })

    const fallbackLocales = await tx.locale.findMany({
      where: { enabled: true, code: { not: code } },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    })
    const fallbackA = fallbackLocales[0]?.code ?? settings.defaultLocale
    const fallbackB = fallbackLocales.find((item) => item.code !== fallbackA)?.code ?? fallbackA

    if (settings.switchLocaleA === code || settings.switchLocaleB === code) {
      await tx.i18nSetting.update({
        where: { id: 'global' },
        data: {
          switchLocaleA: settings.switchLocaleA === code ? fallbackA : settings.switchLocaleA,
          switchLocaleB: settings.switchLocaleB === code ? fallbackB : settings.switchLocaleB,
        },
      })
    }
  })

  if (code !== 'th') {
    try {
      const filePath = getMessagesFilePath(code)
      if (existsSync(filePath)) await unlink(filePath)
    } catch (error) {
      logger.warn('[TranslationService] Failed to remove locale message file', { code, error })
    }
  }
}

export async function isKnownLocale(locale: string) {
  const record = await prisma.locale.findUnique({ where: { code: locale } })
  if (record) return true

  return Boolean(getStaticMessages(locale))
}

export async function getAvailableLocales() {
  const locales = await prisma.locale.findMany({
    where: { enabled: true },
    select: { code: true },
    orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
  })

  if (locales.length > 0) return locales.map((locale) => locale.code)
  return ['th', 'en']
}
