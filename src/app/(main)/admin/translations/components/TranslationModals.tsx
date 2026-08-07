import type { FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { Button, ConfirmModal, Input, Modal, SelectMenu, type SelectMenuOption } from '@/components/ui'
import type { LocaleRecord, Translation } from '../types'

type TranslationModalsProps = {
  isModalOpen: boolean
  editingItem: Translation | null
  translationValue: string
  setTranslationValue: (value: string) => void
  formError: string
  saving: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  closeModal: () => void
  isLanguageModalOpen: boolean
  setIsLanguageModalOpen: (isOpen: boolean) => void
  selectedLanguageCode: string
  setSelectedLanguageCode: (code: string) => void
  languageOptions: SelectMenuOption[]
  languageSaving: boolean
  handleCreateLanguage: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  deletingLocale: LocaleRecord | null
  setDeletingLocale: (locale: LocaleRecord | null) => void
  handleDeleteLanguage: () => void | Promise<void>
}

export function TranslationModals({
  isModalOpen,
  editingItem,
  translationValue,
  setTranslationValue,
  formError,
  saving,
  handleSubmit,
  closeModal,
  isLanguageModalOpen,
  setIsLanguageModalOpen,
  selectedLanguageCode,
  setSelectedLanguageCode,
  languageOptions,
  languageSaving,
  handleCreateLanguage,
  deletingLocale,
  setDeletingLocale,
  handleDeleteLanguage,
}: TranslationModalsProps) {
  const t = useTranslations('translationsAdmin')
  const tCommon = useTranslations('common')

  return (
    <>
      <Modal is_open={isModalOpen} onClose={closeModal} title={t('editTitle')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <p className="text-xs leading-5 text-[var(--color-text-muted)]">{t('editorHint')}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('locale')} value={editingItem?.locale ?? ''} disabled />
            <Input label={t('namespace')} value={editingItem?.namespace ?? ''} disabled />
          </div>

          <Input label={t('key')} value={editingItem?.key ?? ''} disabled />

          {editingItem && (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-low)] p-3">
              <p className="text-[10px] font-black uppercase text-[var(--color-text-faint)]">
                {t('baseValue')}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--color-text-muted)]">
                {editingItem.baseValue}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="translation-value"
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]"
              >
                {t('value')}
              </label>
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-faint)]">
                {t('valueLength', { count: translationValue.length })}
              </span>
            </div>
            <textarea
              id="translation-value"
              className="min-h-[180px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-6 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              value={translationValue}
              onChange={(event) => setTranslationValue(event.target.value)}
              placeholder={t('valuePlaceholder')}
              required
              disabled={saving}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              {tCommon('cancel')}
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        is_open={isLanguageModalOpen}
        onClose={() => !languageSaving && setIsLanguageModalOpen(false)}
        title={t('addLanguage')}
        size="md"
      >
        <form onSubmit={handleCreateLanguage} className="space-y-5">
          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            {t('addLanguageDescription')}
          </p>
          <SelectMenu
            label={t('language')}
            value={selectedLanguageCode}
            onValueChange={setSelectedLanguageCode}
            options={[{ label: t('selectLanguage'), value: '' }, ...languageOptions]}
            disabled={languageSaving}
          />
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-low)] p-3">
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              {t('missingRowsCreated')}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsLanguageModalOpen(false)}
              disabled={languageSaving}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={languageSaving}
              disabled={!selectedLanguageCode}
            >
              {t('createLanguage')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        is_open={!!deletingLocale}
        onClose={() => !languageSaving && setDeletingLocale(null)}
        onConfirm={handleDeleteLanguage}
        title={t('deleteLanguageTitle')}
        message={t('deleteLanguageMessage', {
          locale: deletingLocale ? `${deletingLocale.nativeName} (${deletingLocale.code})` : '',
        })}
        confirm_text={t('deleteLanguage')}
        cancel_text={tCommon('cancel')}
        is_loading={languageSaving}
        variant="danger"
      />
    </>
  )
}
