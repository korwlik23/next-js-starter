import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NotificationDropdown } from '@/components/ui/NotificationDropdown'
import { api } from '@/services/apiClient'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `notification.${key}`,
  useLocale: () => 'en',
}))

jest.mock('@/services/apiClient', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

describe('NotificationDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(api.get as jest.Mock).mockResolvedValue({
      data: {
        unreadCount: 1,
        items: [
          {
            id: 'notification-1',
            title: 'A new notification',
            message: 'A new activity is available.',
            type: 'info',
            isRead: false,
            createdAt: '2026-08-13T00:00:00.000Z',
            link: null,
          },
        ],
      },
    })
  })

  it('uses translated labels and exposes an accessible notification panel', async () => {
    render(<NotificationDropdown />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/notification?limit=10'))

    const trigger = screen.getByRole('button', { name: 'notification.trigger' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'notification.title' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'notification.markAllRead' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'notification.refresh' })).toBeInTheDocument()
    expect(screen.getByText('A new notification')).toBeInTheDocument()
  })
})
