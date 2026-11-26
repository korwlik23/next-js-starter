import type { Dispatch, SetStateAction } from 'react'
import { useTranslations } from 'next-intl'
import { Settings2, Trash2 } from 'lucide-react'
import { Button, SelectMenu, type SelectMenuOption } from '@/components/ui'
import type { I18nAdminPayload, I18nSettings, LocaleRecord } from '../types'

type LanguageSettingsProps = {
  i18nConfig: I18nAdminPayload | null
  settingsDraft: I18nSettings
  setSettingsDraft: Dispatch<SetStateAction<I18nSettings>>
  configLoading: boolean
  settingsSaving: boolean
  languageSaving: boolean
  localeOptions: SelectMenuOption[]
  handleSaveSettings: () => Promise<void>
  setDeletingLocale: (locale: LocaleRecord | null) => void
}

export function LanguageSettings({
  i18nConfig,
  settingsDraft,
  setSettingsDraft,
  configLoading,
  settingsSaving,
  languageSaving,
  localeOptions,
  handleSaveSettings,
  setDeletingLocale,
}: LanguageSettingsProps) {
  const t = useTranslations('translationsAdmin')

  return (
    <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-sm font-black uppercase text-[var(--color-primary)]">
              {t('languageSettings')}
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
            {t('languageSettingsDescription')}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <SelectMenu
            label={t('languageMode')}
            value={settingsDraft.langMode}
            onValueChange={(nextMode) =>
              setSettingsDraft({
                ...settingsDraft,
                langMode: nextMode === 'multi' ? 'multi' : 'switch',
              })
            }
            options={[
              { label: t('switchMode'), value: 'switch' },
              { label: t('multiMode'), value: 'multi' },
            ]}
            disabled={configLoading || settingsSaving}
          />
          <SelectMenu
            label={t('defaultLocale')}
            value={settingsDraft.defaultLocale}
            onValueChange={(nextLocale) =>
              setSettingsDraft({ ...settingsDraft, defaultLocale: nextLocale })
            }
            options={localeOptions}
            disabled={configLoading || settingsSaving}
          />
          <SelectMenu
            label={t('switchLocaleA')}
            value={settingsDraft.switchLocaleA}
            onValueChange={(nextLocale) =>
              setSettingsDraft({ ...settingsDraft, switchLocaleA: nextLocale })
            }
            options={localeOptions}
            disabled={configLoading || settingsSaving}
          />
          <SelectMenu
            label={t('switchLocaleB')}
            value={settingsDraft.switchLocaleB}
            onValueChange={(nextLocale) =>
              setSettingsDraft({ ...settingsDraft, switchLocaleB: nextLocale })
            }
            options={localeOptions}
            disabled={configLoading || settingsSaving}
          />
          <Button
            className="min-w-40 self-end"
            variant="primary"
            onClick={handleSaveSettings}
            isLoading={settingsSaving}
          >
            {t('saveSettings')}
          </Button>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-[var(--color-text-faint)]">
            {t('activeLanguages')}
          </p>
          <div className="flex flex-wrap gap-2">
            {(i18nConfig?.locales ?? []).map((locale) => {
              const cannotDelete = locale.code === 'en' || locale.isDefault
              return (
                <div
                  key={locale.code}
                  className="inline-flex min-h-9 items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <span className="px-3 text-xs font-bold text-[var(--color-text)]">
                    {locale.nativeName} ({locale.code})
                  </span>
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center border-l border-[var(--color-border)] text-[var(--color-text-faint)] transition hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-faint)]"
                    aria-label={`${t('deleteLanguage')} ${locale.code}`}
                    disabled={cannotDelete || languageSaving}
                    onClick={() => setDeletingLocale(locale)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
