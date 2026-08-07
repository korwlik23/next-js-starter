import { render, screen, waitFor } from '@testing-library/react'
import * as ui from '@/components/ui'
import ComponentShowcase from '@/components/ui/ComponentShowcase'

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, string> = {
      'devUi.sections.button': 'Button',
      'devUi.sections.datePicker': 'Date picker',
      'devUi.sections.fileUpload': 'File upload',
      'devUi.sections.searchInput': 'Search input',
      'devUi.sections.selectMenu': 'Select menu',
      'devUi.sections.permissionGuard': 'Permission guard',
      'devUi.sections.textarea': 'Textarea',
      'devUi.sections.alert': 'Alert',
      'devUi.sections.card': 'Card',
      'devUi.sections.pageHeader': 'Page header',
      'devUi.sections.statCard': 'Stat card',
      'devUi.sections.table': 'Table',
      'devUi.sections.chart': 'Chart',
      'devUi.sections.toast': 'Toast',
    }

    return translations[`${namespace}.${key}`] ?? `${namespace}.${key}`
  },
}))

jest.mock('@/components/chart/LineChart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}))

jest.mock('@/components/chart/BarChart', () => ({
  BarChart: () => <div data-testid="bar-chart" />,
}))

describe('UI component barrel and showcase', () => {
  it('exports every component used by shared callers and the showcase', () => {
    expect(ui.NotificationDropdown).toBeDefined()
    expect(ui.DatePicker).toBeDefined()
    expect(ui.FileUploadDropzone).toBeDefined()
    expect(ui.FileUpload).toBeDefined()
    expect(ui.SearchInput).toBeDefined()
    expect(ui.SelectMenu).toBeDefined()
    expect(ui.Can).toBeDefined()
    expect(ui.Button).toBeDefined()
    expect(ui.Modal).toBeDefined()
    expect(ui.Drawer).toBeDefined()
    expect(ui.Tabs).toBeDefined()
  })

  it('exposes a showcase that renders the complete UI inventory', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], unreadCount: 0 }),
    })

    render(<ComponentShowcase />)

    for (const heading of [
      'Button',
      'Date picker',
      'File upload',
      'Search input',
      'Select menu',
      'Permission guard',
      'Textarea',
      'Alert',
      'Card',
      'Page header',
      'Stat card',
      'Table',
      'Chart',
      'Toast',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})
