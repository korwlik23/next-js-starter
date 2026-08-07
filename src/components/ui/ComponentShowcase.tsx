'use client'

import { useTranslations } from 'next-intl'
import { BasicControlsShowcase } from './showcase/BasicControlsShowcase'
import { DataDisplayShowcase } from './showcase/DataDisplayShowcase'
import { FeedbackShowcase } from './showcase/FeedbackShowcase'
import { InteractionShowcase } from './showcase/InteractionShowcase'
import { OverlayShowcase } from './showcase/OverlayShowcase'
import { VisualShowcase } from './showcase/VisualShowcase'

export function ComponentShowcase() {
  const t = useTranslations('devUi')

  return (
    <div>
      <header className="mb-12">
        <p className="label-xs mb-2" style={{ color: 'var(--color-text-subtle)' }}>
          {t('header.eyebrow')}
        </p>
        <h1 className="text-4xl font-extrabold tracking-tighter" style={{ color: 'var(--color-primary)' }}>
          {t('header.title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('header.description')}{' '}
          <code
            className="rounded px-1 py-0.5 text-xs font-mono"
            style={{
              backgroundColor: 'var(--color-surface-high)',
              color: 'var(--color-primary)',
            }}
          >
            @/components/ui
          </code>
        </p>
      </header>

      <BasicControlsShowcase />
      <DataDisplayShowcase />
      <InteractionShowcase />
      <OverlayShowcase />
      <FeedbackShowcase />
      <VisualShowcase />
    </div>
  )
}

export default ComponentShowcase
