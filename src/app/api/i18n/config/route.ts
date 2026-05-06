import { NextResponse } from 'next/server'
import { TranslationService } from '@/modules/i18n/service'

export async function GET() {
  try {
    const runtimeConfig = await TranslationService.getRuntimeConfig()
    return NextResponse.json({
      success: true,
      data: {
        settings: runtimeConfig.settings,
        locales: runtimeConfig.locales,
        availableLocales: runtimeConfig.availableLocales,
      },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        settings: {
          id: 'global',
          langMode: 'switch',
          defaultLocale: 'th',
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
      },
    })
  }
}
