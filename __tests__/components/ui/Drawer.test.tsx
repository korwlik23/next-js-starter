import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'

function DrawerHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer
        is_open={open}
        onClose={() => setOpen(false)}
        title="Drawer title"
        close_label="Close drawer"
      >
        <input aria-label="Drawer field" />
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('focuses the drawer, locks body scroll, and restores focus on close', () => {
    render(<DrawerHarness />)

    const trigger = screen.getByRole('button', { name: 'Open drawer' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Drawer title' })).toBeInTheDocument()
    const closeButton = screen.getByRole('button', { name: 'Close drawer' })
    const field = screen.getByRole('textbox', { name: 'Drawer field' })

    expect(closeButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(field, { key: 'Tab' })
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true })
    expect(field).toHaveFocus()

    fireEvent.click(closeButton)

    expect(screen.queryByRole('dialog', { name: 'Drawer title' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })
})
