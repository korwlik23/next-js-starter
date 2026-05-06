import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { GenerateId } from '@/lib/ulid'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { existsSync, readFileSync } from 'fs'
import { copyFile, unlink } from 'fs/promises'
import path from 'path'
import enMessages from '../../../messages/en.json'
import thMessages from '../../../messages/th.json'

export type LangMode = 'switch' | 'multi'
export type TranslationStatus = 'missing' | 'machine_translated' | 'reviewed' | 'published'
export type TranslationSource = 'manual' | 'machine' | 'imported'

export interface TranslationInput {
  locale: string
  namespace: string
  key: string
  value: string
  updatedBy?: string | null
}

export interface LocaleInput {
  code: string
  name: string
  nativeName: string
  enabled?: boolean
  fallbackLocale?: string | null
}

export interface I18nSettingsInput {
  langMode: LangMode
  defaultLocale: string
  switchLocaleA: string
  switchLocaleB: string
}

export interface TranslationCatalogItem {
  id: string
  locale: string
  namespace: string
  key: string
  value: string | null
  effectiveValue: string
  baseValue: string
  source: TranslationSource | 'json'
  status: TranslationStatus | 'json'
  isOverridden: boolean
}

export const AVAILABLE_LANGUAGE_OPTIONS = [
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
]

const BASE_MESSAGES_BY_LOCALE: Record<string, Record<string, unknown>> = {
  en: enMessages,
  th: thMessages,
}

function normalizeLocaleCode(locale: string) {
  return locale.trim().toLowerCase()
}

function getMessagesFilePath(locale: string) {
  if (!/^[a-z]{2,5}(-[a-z0-9]{2,8})?$/.test(locale)) {
    throw new Error('INVALID_LOCALE')
  }

  return path.join(process.cwd(), 'messages', `${locale}.json`)
}

function normalizeLangMode(value: string): LangMode {
  return value === 'multi' ? 'multi' : 'switch'
}

function normalizeStatus(value: string): TranslationStatus {
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

function normalizeSource(value: string): TranslationSource {
  if (value === 'machine' || value === 'imported' || value === 'manual') return value
  return 'manual'
}

function flattenMessages(
  value: unknown,
  path: string[] = []
): Array<{ key: string; value: string }> {
  if (typeof value === 'string') {
    return [{ key: path.join('.'), value }]
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  return Object.entries(value).flatMap(([childKey, childValue]) =>
    flattenMessages(childValue, [...path, childKey])
  )
}

function getStaticMessages(locale: string) {
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

function getBaseCatalog(locale: string, fallbackLocale: string = DEFAULT_LOCALE) {
  const messages =
    getStaticMessages(locale) ??
    getStaticMessages(fallbackLocale) ??
    getStaticMessages(DEFAULT_LOCALE) ??
    {}

  return Object.entries(messages).flatMap(([namespace, namespaceMessages]) =>
    flattenMessages(namespaceMessages).map(({ key, value }) => ({
      locale,
      namespace,
      key,
      value,
    }))
  )
}

function translationIdentity(namespace: string, key: string) {
  return `${namespace}.${key}`
}

function setNestedTranslation(
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

function extractPlaceholders(value: string) {
  return Array.from(value.matchAll(/\{[a-zA-Z0-9_.-]+\}/g))
    .map((match) => match[0])
    .sort()
}

function hasSamePlaceholders(source: string, translated: string) {
  return extractPlaceholders(source).join('|') === extractPlaceholders(translated).join('|')
}

async function translateText(input: { text: string; sourceLocale: string; targetLocale: string }) {
  const endpoint = process.env.AUTO_TRANSLATE_ENDPOINT
  if (!endpoint) throw new Error('AUTO_TRANSLATE_NOT_CONFIGURED')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AUTO_TRANSLATE_API_KEY
        ? { Authorization: `Bearer ${process.env.AUTO_TRANSLATE_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      q: input.text,
      source: input.sourceLocale,
      target: input.targetLocale,
      format: 'text',
      api_key: process.env.AUTO_TRANSLATE_API_KEY || undefined,
    }),
  })

  if (!response.ok) throw new Error('AUTO_TRANSLATE_FAILED')
  const data = await response.json()
  const translatedText = data?.translatedText ?? data?.translation ?? data?.text
  if (typeof translatedText !== 'string' || !translatedText.trim()) {
    throw new Error('AUTO_TRANSLATE_EMPTY')
  }

  return translatedText
}

export const TranslationService = {
  async ensureDefaults() {
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
  },

  async getSettings() {
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

    await this.ensureDefaults()
    return {
      id: 'global',
      langMode: 'switch' as const,
      defaultLocale: DEFAULT_LOCALE,
      switchLocaleA: 'th',
      switchLocaleB: 'en',
    }
  },

  async getLocales(options: { enabledOnly?: boolean } = {}) {
    const locales = await prisma.locale.findMany({
      where: options.enabledOnly ? { enabled: true } : undefined,
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    })

    if (locales.length > 0) return locales

    await this.ensureDefaults()
    return prisma.locale.findMany({
      where: options.enabledOnly ? { enabled: true } : undefined,
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    })
  },

  async getRuntimeConfig() {
    const [settings, locales] = await Promise.all([
      this.getSettings(),
      this.getLocales({ enabledOnly: true }),
    ])
    const enabledLocales = locales.map((locale) => locale.code)
    const switchLocales = [settings.switchLocaleA, settings.switchLocaleB].filter((locale) =>
      enabledLocales.includes(locale)
    )

    return {
      settings,
      locales,
      availableLocales: settings.langMode === 'switch' ? switchLocales : enabledLocales,
    }
  },

  async updateSettings(input: I18nSettingsInput) {
    const locales = await this.getLocales({ enabledOnly: true })
    const enabledLocaleCodes = new Set(locales.map((locale) => locale.code))

    if (!enabledLocaleCodes.has(input.defaultLocale)) {
      throw new Error('DEFAULT_LOCALE_DISABLED')
    }
    if (
      !enabledLocaleCodes.has(input.switchLocaleA) ||
      !enabledLocaleCodes.has(input.switchLocaleB)
    ) {
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

    return this.getRuntimeConfig()
  },

  async createLocale(input: LocaleInput) {
    const code = normalizeLocaleCode(input.code)
    if (!/^[a-z]{2,5}(-[a-z0-9]{2,8})?$/.test(code)) {
      throw new Error('INVALID_LOCALE')
    }

    await this.ensureLocaleMessageFile(code)

    const fallbackLocale = input.fallbackLocale ?? (code === 'en' ? null : 'en')
    const baseCatalog = getBaseCatalog(code, fallbackLocale ?? 'en')

    const locale = await prisma.$transaction(async (tx) => {
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

    return locale
  },

  async ensureLocaleMessageFile(locale: string) {
    const code = normalizeLocaleCode(locale)
    if (code === 'en') return

    const targetPath = getMessagesFilePath(code)
    if (existsSync(targetPath)) return

    await copyFile(getMessagesFilePath('en'), targetPath)
  },

  async deleteLocale(locale: string) {
    const code = normalizeLocaleCode(locale)
    if (code === 'en') throw new Error('CANNOT_DELETE_EN')

    const settings = await this.getSettings()
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
  },

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
      return translation
    } catch (error) {
      logger.error('[TranslationService] Failed to upsert translation', error)
      throw error
    }
  },

  async getByLocale(locale: string) {
    return prisma.translation.findMany({
      where: { locale },
      orderBy: { key: 'asc' },
    })
  },

  async getCatalogByLocale(locale: string): Promise<TranslationCatalogItem[]> {
    const localeRecord = await prisma.locale.findUnique({ where: { code: locale } })
    const settings = await this.getSettings()
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
  },

  isKnownKey(locale: string, namespace: string, key: string, fallbackLocale = DEFAULT_LOCALE) {
    return getBaseCatalog(locale, fallbackLocale).some(
      (item) => item.namespace === namespace && item.key === key
    )
  },

  async isKnownLocale(locale: string) {
    const record = await prisma.locale.findUnique({ where: { code: locale } })
    if (record) return true

    const staticMessages = getStaticMessages(locale)
    return Boolean(staticMessages)
  },

  async getRuntimeDbMessages(locale: string) {
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
  },

  async autoTranslateMissing(locale: string, updatedBy?: string | null) {
    const settings = await this.getSettings()
    const localeRecord = await prisma.locale.findUnique({ where: { code: locale } })
    if (!localeRecord) throw new Error('LOCALE_NOT_FOUND')

    const sourceLocale = localeRecord.fallbackLocale ?? settings.defaultLocale
    const catalog = await this.getCatalogByLocale(locale)
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
  },

  getBaseMessages(locale: string, fallbackLocale: string = DEFAULT_LOCALE) {
    return (
      getStaticMessages(locale) ??
      getStaticMessages(fallbackLocale) ??
      getStaticMessages(DEFAULT_LOCALE) ??
      {}
    )
  },

  async getAvailableLocales() {
    const locales = await prisma.locale.findMany({
      where: { enabled: true },
      select: { code: true },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    })

    if (locales.length > 0) return locales.map((locale) => locale.code)
    return ['th', 'en']
  },

  async delete(locale: string, namespace: string, key: string) {
    return prisma.translation.delete({
      where: {
        locale_namespace_key: { locale, namespace, key },
      },
    })
  },
}
