import { useTranslations } from 'next-intl'
import { ShowcaseSection } from './ShowcaseSection'

const colorVariables = [
  '--color-primary',
  '--color-bg',
  '--color-surface-low',
  '--color-surface-mid',
  '--color-surface-high',
  '--color-border',
  '--color-text',
  '--color-text-muted',
  '--color-success',
  '--color-error',
  '--color-warning',
  '--color-info',
]

const iconNames = [
  'dashboard',
  'group',
  'settings',
  'notifications',
  'search',
  'add',
  'edit',
  'delete',
  'arrow_forward',
  'upload_file',
  'analytics',
  'history',
  'person',
  'rocket_launch',
  'auto_awesome',
  'shield',
  'payments',
  'key',
  'lock',
  'check_circle',
]

export function VisualShowcase() {
  const t = useTranslations('devUi')

  return (
    <>
      <ShowcaseSection title={t('sections.typography')}>
        <div className="w-full space-y-3">
          <div className="text-5xl font-extrabold tracking-tighter" style={{ color: 'var(--color-primary)' }}>
            {t('visual.display')}
          </div>
          <div className="text-4xl font-extrabold tracking-tighter" style={{ color: 'var(--color-primary)' }}>
            {t('visual.headingOne')}
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
            {t('visual.headingTwo')}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('visual.body')}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            {t('visual.caption')}
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.colors')}>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {colorVariables.map((cssVariable) => (
            <div key={cssVariable} className="flex items-center gap-3">
              <div
                className="h-8 w-8 shrink-0 rounded"
                style={{
                  backgroundColor: `var(${cssVariable})`,
                  border: '1px solid var(--color-border)',
                }}
                aria-label={cssVariable}
              />
              <code className="break-all text-[10px] font-mono" style={{ color: 'var(--color-text-subtle)' }}>
                {cssVariable}
              </code>
            </div>
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.icons')}>
        <div className="flex flex-wrap gap-5">
          {iconNames.map((icon) => (
            <span key={icon} className="material-symbols-outlined text-2xl" aria-hidden="true">
              {icon}
            </span>
          ))}
        </div>
      </ShowcaseSection>
    </>
  )
}
