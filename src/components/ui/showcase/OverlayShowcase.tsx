'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '../Button'
import { ConfirmModal, Modal } from '../Modal'
import { Drawer } from '../Drawer'
import { Input } from '../Input'
import { ShowcaseSection } from './ShowcaseSection'

export function OverlayShowcase() {
  const t = useTranslations('devUi')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <ShowcaseSection title={t('sections.modal')}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          {t('modal.open')}
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          {t('modal.openConfirm')}
        </Button>

        <Modal is_open={modalOpen} onClose={() => setModalOpen(false)} title={t('modal.title')}>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('modal.description')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('modal.cancel')}
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              {t('modal.confirm')}
            </Button>
          </div>
        </Modal>

        <ConfirmModal
          is_open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title={t('modal.confirmTitle')}
          message={t('modal.confirmMessage')}
          confirm_text={t('modal.confirm')}
          cancel_text={t('modal.cancel')}
          variant="danger"
        />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.drawer')}>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          {t('drawer.open')}
        </Button>

        <Drawer
          is_open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={t('drawer.title')}
          close_label={t('drawer.close')}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('drawer.description')}
            </p>
            <Input label={t('drawer.nameLabel')} placeholder={t('drawer.namePlaceholder')} />
            <Button variant="primary" className="w-full" onClick={() => setDrawerOpen(false)}>
              {t('drawer.save')}
            </Button>
          </div>
        </Drawer>
      </ShowcaseSection>
    </>
  )
}
