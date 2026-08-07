import { fireEvent, render, screen } from '@testing-library/react'
import { DataDisplayShowcase } from '@/components/ui/showcase/DataDisplayShowcase'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `devUi.${key}`,
}))

jest.mock('@/components/chart/LineChart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}))

jest.mock('@/components/chart/BarChart', () => ({
  BarChart: () => <div data-testid="bar-chart" />,
}))

describe('UI showcase state coverage', () => {
  it('exposes data, loading, empty, and error table states', () => {
    const { container } = render(<DataDisplayShowcase />)

    expect(screen.getByText('devUi.table.alexName')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'devUi.table.states.data' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    fireEvent.click(screen.getByRole('button', { name: 'devUi.table.states.loading' }))
    expect(screen.getByRole('button', { name: 'devUi.table.states.loading' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: 'devUi.table.states.empty' }))
    expect(screen.getByText('devUi.table.emptyMessage')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'devUi.table.states.error' }))
    expect(screen.getByRole('alert')).toHaveTextContent('devUi.table.errorDescription')
  })
})
