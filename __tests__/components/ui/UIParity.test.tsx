import { fireEvent, render, screen } from '@testing-library/react'
import hotToast from 'react-hot-toast'
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Textarea,
} from '@/components/ui'
import { dismissToast, showToast } from '@/components/ui/Toast'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('react-hot-toast', () => {
  const toast = Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  })

  return { __esModule: true, default: toast, toast }
})

describe('shared UI parity primitives', () => {
  it('exposes semantic textarea, alert, card, and page header contracts', () => {
    const onDismiss = jest.fn()

    render(
      <div>
        <PageHeader title="Page title" description="Page description" />
        <Textarea label="Message" defaultValue="Hello" maxLength={10} showCount />
        <Textarea label="Disabled message" disabled />
        <Alert variant="error" title="Error title" dismissible dismissLabel="Dismiss" onDismiss={onDismiss}>
          Error description
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>
      </div>
    )

    expect(screen.getByRole('heading', { name: 'Page title', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('maxlength', '10')
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Disabled message' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Error description')
    expect(screen.getByRole('heading', { name: 'Card title', level: 3 })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('delegates toast variants and dismissal to react-hot-toast', () => {
    showToast('Saved', 'success')
    showToast('Failed', 'error')
    showToast('Review this', 'warning')
    dismissToast()

    expect(hotToast.success).toHaveBeenCalledWith('Saved', undefined)
    expect(hotToast.error).toHaveBeenCalledWith('Failed', undefined)
    expect(hotToast).toHaveBeenCalledWith('Review this', expect.objectContaining({ icon: expect.anything() }))
    expect(hotToast.dismiss).toHaveBeenCalledTimes(1)
  })
})
