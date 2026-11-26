import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (key === 'close' ? 'Close modal' : key),
}))

function ModalHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <Modal is_open={open} onClose={() => setOpen(false)} title="Modal title">
        <input aria-label="Modal field" />
      </Modal>
    </>
  )
}

describe('Modal', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('focuses the modal, traps Tab navigation, locks scroll, and restores focus on close', () => {
    render(<ModalHarness />)

    const trigger = screen.getByRole('button', { name: 'Open modal' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Modal title' })).toBeInTheDocument()
    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    const field = screen.getByRole('textbox', { name: 'Modal field' })

    expect(closeButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(field, { key: 'Tab' })
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true })
    expect(field).toHaveFocus()

    fireEvent.click(closeButton)

    expect(screen.queryByRole('dialog', { name: 'Modal title' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })
})
