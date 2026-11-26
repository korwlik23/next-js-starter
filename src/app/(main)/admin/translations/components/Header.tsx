import { useTranslations } from 'next-intl'
import { Languages, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { Badge, Button, SelectMenu, type SelectMenuOption } from '@/components/ui'
import { ALL } from '../types'

type HeaderProps = {
  currentLocale: string
  setCurrentLocale: (locale: string) => void
  setSelectedNamespace: (namespace: string) => void
  setSelectedStatus: (status: string) => void
  localeOptions: SelectMenuOption[]
  loading: boolean
  fetchTranslations: () => Promise<void>
  autoTranslating: boolean
  missingTranslations: number
  handleAutoTranslate: () => Promise<void>
  setIsLanguageModalOpen: (isOpen: boolean) => void
}

export function Header({
  currentLocale,
  setCurrentLocale,
  setSelectedNamespace,
  setSelectedStatus,
  localeOptions,
  loading,
  fetchTranslations,
  autoTranslating,
  missingTranslations,
  handleAutoTranslate,
  setIsLanguageModalOpen,
}: HeaderProps) {
  const t = useTranslations('translationsAdmin')

  return (
    <header className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <Languages className="h-4 w-4" aria-hidden="true" />
          </span>
          <Badge variant="primary" className="uppercase">
            {currentLocale}
          </Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-primary)] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm font-medium text-[var(--color-text-subtle)]">
          {t('description')}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SelectMenu
          aria-label={t('locale')}
          value={currentLocale}
          onValueChange={(nextLocale) => {
            setCurrentLocale(nextLocale)
            setSelectedNamespace(ALL)
            setSelectedStatus(ALL)
          }}
          options={localeOptions}
          className="min-w-48"
        />
        <Button variant="secondary" onClick={() => fetchTranslations()} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('refresh')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleAutoTranslate}
          disabled={autoTranslating || missingTranslations === 0}
          isLoading={autoTranslating}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t('autoTranslate')}
        </Button>
        <Button variant="primary" onClick={() => setIsLanguageModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addLanguage')}
        </Button>
      </div>
    </header>
  )
}
