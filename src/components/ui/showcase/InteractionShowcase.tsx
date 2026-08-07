'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Accordion } from '../Accordion'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Can } from '../Can'
import { Dropdown } from '../Dropdown'
import { FileUploadDropzone } from '../FileUploadDropzone'
import { NotificationDropdown } from '../NotificationDropdown'
import { Tabs } from '../Tabs'
import { Tooltip } from '../Tooltip'
import { ShowcaseSection } from './ShowcaseSection'

export function InteractionShowcase() {
  const t = useTranslations('devUi')
  const [files, setFiles] = useState<File[]>([])

  return (
    <>
      <ShowcaseSection title={t('sections.fileUpload')}>
        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
          <FileUploadDropzone
            label={t('fileUpload.label')}
            helperText={t('fileUpload.helper')}
            accept={{ 'image/*': [] }}
            maxFiles={2}
            value={files}
            onChange={setFiles}
          />
          <FileUploadDropzone
            label={t('fileUpload.errorLabel')}
            helperText={t('fileUpload.error')}
            error={t('fileUpload.error')}
            accept={{ 'image/*': [] }}
          />
          <FileUploadDropzone
            label={t('fileUpload.disabledLabel')}
            helperText={t('fileUpload.disabledHelper')}
            accept={{ 'image/*': [] }}
            disabled
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.tooltip')}>
        <Tooltip content={t('tooltip.top')} position="top">
          <Button variant="secondary">{t('tooltip.topButton')}</Button>
        </Tooltip>
        <Tooltip content={t('tooltip.bottom')} position="bottom">
          <Button variant="secondary">{t('tooltip.bottomButton')}</Button>
        </Tooltip>
        <Tooltip content={t('tooltip.left')} position="left">
          <Button variant="secondary">{t('tooltip.leftButton')}</Button>
        </Tooltip>
        <Tooltip content={t('tooltip.right')} position="right">
          <Button variant="secondary">{t('tooltip.rightButton')}</Button>
        </Tooltip>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.dropdown')}>
        <Dropdown
          trigger={<Button variant="secondary">{t('dropdown.trigger')}</Button>}
          items={[
            { label: t('dropdown.profile'), icon: 'person', onClick: () => undefined },
            { label: t('dropdown.edit'), icon: 'edit', onClick: () => undefined },
            { is_divider: true, label: '' },
            { label: t('dropdown.delete'), icon: 'delete', is_danger: true, onClick: () => undefined },
          ]}
          align="left"
        />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.tabs')}>
        <div className="w-full">
          <Tabs
            items={[
              { value: 'overview', label: t('tabs.overview'), icon: 'dashboard', content: <p>{t('tabs.overviewContent')}</p> },
              { value: 'settings', label: t('tabs.settings'), icon: 'settings', content: <p>{t('tabs.settingsContent')}</p> },
              { value: 'disabled', label: t('tabs.disabled'), disabled: true, content: null },
            ]}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.accordion')}>
        <div className="w-full max-w-xl">
          <Accordion
            items={[
              { id: 'starter', title: t('accordion.starterQuestion'), content: t('accordion.starterAnswer') },
              { id: 'database', title: t('accordion.databaseQuestion'), content: t('accordion.databaseAnswer') },
              { id: 'disabled', title: t('accordion.disabled'), content: t('accordion.disabledAnswer'), is_disabled: true },
            ]}
            default_open={['starter']}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.permissionGuard')}>
        <Can
          permission="user.create"
          fallback={<Badge variant="warning">{t('permission.denied')}</Badge>}
        >
          <Button variant="primary">{t('permission.allowedAction')}</Button>
        </Can>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.notification')}>
        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('notification.description')}
          </span>
        </div>
      </ShowcaseSection>
    </>
  )
}
