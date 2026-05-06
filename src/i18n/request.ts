import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE } from './config'
import { deepMerge } from '@/utils/object'
import { unstable_cache } from 'next/cache'
import { TranslationService } from '@/modules/i18n/service'

const getRuntimeConfig = unstable_cache(
  async () => {
    try {
      return await TranslationService.getRuntimeConfig()
    } catch (error) {
      console.error('[i18n] Error fetching locale runtime config:', error)
      return {
        settings: {
          id: 'global',
          langMode: 'switch' as const,
          defaultLocale: DEFAULT_LOCALE,
          switchLocaleA: 'th',
          switchLocaleB: 'en',
        },
        locales: [
          {
            code: 'th',
            name: 'Thai',
            nativeName: 'ไทย',
            enabled: true,
            isDefault: true,
            fallbackLocale: null,
          },
          {
            code: 'en',
            name: 'English',
            nativeName: 'English',
            enabled: true,
            isDefault: false,
            fallbackLocale: 'th',
          },
        ],
        availableLocales: ['th', 'en'],
      }
    }
  },
  ['i18n-runtime-config'],
  { tags: ['i18n-settings', 'translations'], revalidate: 3600 }
)

const getDbTranslations = unstable_cache(
  async (locale: string) => {
    try {
      return await TranslationService.getRuntimeDbMessages(locale)
    } catch (error) {
      console.error('[i18n] Error fetching DB translations:', error)
      return {}
    }
  },
  ['translations'],
  { tags: ['translations'], revalidate: 3600 }
)

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('locale')?.value
  const runtimeConfig = await getRuntimeConfig()
  const availableLocales = runtimeConfig.availableLocales
  const defaultLocale = runtimeConfig.settings.defaultLocale || DEFAULT_LOCALE
  const locale =
    cookieLocale && availableLocales.includes(cookieLocale) ? cookieLocale : defaultLocale
  const localeRecord = runtimeConfig.locales.find((item) => item.code === locale)
  const fallbackLocale = localeRecord?.fallbackLocale ?? defaultLocale
  const baseMessages = TranslationService.getBaseMessages(locale, fallbackLocale)
  const dbMessages = await getDbTranslations(locale)
  const mergedMessages = deepMerge(baseMessages, dbMessages)

  return {
    locale,
    messages: mergedMessages,
  }
})
