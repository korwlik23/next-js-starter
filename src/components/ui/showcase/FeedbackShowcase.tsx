import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { Spinner } from '../Loader'
import { Skeleton, SkeletonCard } from '../Skeleton'
import { dismissToast, showToast } from '../Toast'
import { ShowcaseSection } from './ShowcaseSection'

export function FeedbackShowcase() {
  const t = useTranslations('devUi')
  const [errorAlertVisible, setErrorAlertVisible] = useState(true)
  const latestToastId = useRef<string | undefined>(undefined)

  const displayToast = (variant: 'success' | 'warning' | 'error') => {
    latestToastId.current = showToast(t(`toast.${variant}Message`), variant)
  }

  return (
    <>
      <ShowcaseSection title={t('sections.alert')}>
        <div className="w-full space-y-3">
          <Alert variant="neutral" title={t('alert.neutralTitle')}>
            {t('alert.neutral')}
          </Alert>
          <Alert variant="success" title={t('alert.successTitle')}>
            {t('alert.success')}
          </Alert>
          <Alert variant="warning" title={t('alert.warningTitle')}>
            {t('alert.warning')}
          </Alert>
          {errorAlertVisible && (
            <Alert
              variant="error"
              title={t('alert.errorTitle')}
              dismissible
              dismissLabel={t('alert.dismiss')}
              onDismiss={() => setErrorAlertVisible(false)}
            >
              {t('alert.error')}
            </Alert>
          )}
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.toast')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="primary" onClick={() => displayToast('success')}>
            {t('toast.successButton')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => displayToast('error')}>
            {t('toast.errorButton')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => displayToast('warning')}>
            {t('toast.warningButton')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => dismissToast(latestToastId.current)}>
            {t('toast.dismissButton')}
          </Button>
        </div>
        <p className="w-full text-sm text-[var(--color-text-muted)]">{t('toast.description')}</p>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.loader')}>
        <div className="flex items-center gap-8">
          <Spinner size="sm" aria-label={t('feedback.loadingSmall')} />
          <Spinner size="md" aria-label={t('feedback.loadingMedium')} />
          <Spinner size="lg" aria-label={t('feedback.loadingLarge')} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.skeleton')}>
        <div className="w-full max-w-lg space-y-3">
          <Skeleton lines={3} />
          <p className="label-xs mb-3" style={{ color: 'var(--color-text-subtle)' }}>
            {t('feedback.cardLabel')}
          </p>
          <SkeletonCard />
        </div>
      </ShowcaseSection>
    </>
  )
}
