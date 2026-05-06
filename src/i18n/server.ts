import type { NextRequest } from 'next/server'
import enMessages from '../../messages/en.json'
import thMessages from '../../messages/th.json'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './config'

const dictionaries = {
  en: enMessages,
  th: thMessages,
} as const

function isSupportedLocale(locale: string | undefined): locale is SupportedLocale {
  return !!locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

function getNestedMessage(messages: unknown, key: string): string | undefined {
  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part]
    }
    return undefined
  }, messages) as string | undefined
}

export function getLocaleFromRequest(request: NextRequest): SupportedLocale {
  const cookieLocale = request.cookies.get('locale')?.value
  if (isSupportedLocale(cookieLocale)) return cookieLocale

  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const preferredLocale = acceptLanguage
    .split(',')
    .map((language) => language.trim().split(';')[0].split('-')[0].toLowerCase())
    .find(isSupportedLocale)

  return preferredLocale ?? DEFAULT_LOCALE
}

export function translate(
  locale: SupportedLocale,
  key: string,
  fallback?: string,
  params?: Record<string, string | number>
) {
  const message =
    getNestedMessage(dictionaries[locale], key) ??
    getNestedMessage(dictionaries[DEFAULT_LOCALE], key) ??
    fallback ??
    key

  if (!params) return message

  return Object.entries(params).reduce(
    (text, [paramKey, value]) => text.replaceAll(`{${paramKey}}`, String(value)),
    message
  )
}
