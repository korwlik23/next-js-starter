'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BarChart } from '@/components/chart/BarChart'
import { LineChart } from '@/components/chart/LineChart'
import { StatCard } from '@/components/chart/StatCard'
import { DataTable } from '@/components/table/DataTable'
import { Alert } from '../Alert'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card'
import { PageHeader } from '../PageHeader'
import { ShowcaseSection } from './ShowcaseSection'

type TableState = 'data' | 'loading' | 'empty' | 'error'

interface TableRow {
  id: string
  name: string
  email: string
  status: 'active' | 'invited'
}

const tableStates: TableState[] = ['data', 'loading', 'empty', 'error']

export function DataDisplayShowcase() {
  const t = useTranslations('devUi')
  const [tableState, setTableState] = useState<TableState>('data')
  const [page, setPage] = useState(1)

  const rows: TableRow[] = [
    { id: 'alex', name: t('table.alexName'), email: t('table.alexEmail'), status: 'active' },
    { id: 'maya', name: t('table.mayaName'), email: t('table.mayaEmail'), status: 'invited' },
    { id: 'sam', name: t('table.samName'), email: t('table.samEmail'), status: 'active' },
  ]

  const columns = [
    { key: 'name', label: t('table.name'), sortable: true },
    { key: 'email', label: t('table.email') },
    {
      key: 'status',
      label: t('table.status'),
      render: (row: TableRow) => (
        <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
          {t(`table.${row.status}`)}
        </Badge>
      ),
    },
  ]

  const chartData = [
    { name: t('chart.jan'), value: 18, signups: 12 },
    { name: t('chart.feb'), value: 24, signups: 20 },
    { name: t('chart.mar'), value: 21, signups: 16 },
    { name: t('chart.apr'), value: 32, signups: 27 },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.pageHeader')}>
        <PageHeader
          className="w-full"
          eyebrow={t('pageHeader.eyebrow')}
          title={t('pageHeader.title')}
          description={t('pageHeader.description')}
          actions={<Button variant="secondary">{t('pageHeader.action')}</Button>}
        />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.card')}>
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('card.title')}</CardTitle>
              <CardDescription>{t('card.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)]">{t('card.longContent')}</p>
            </CardContent>
            <CardFooter className="text-xs text-[var(--color-text-subtle)]">{t('card.footer')}</CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('card.emptyTitle')}</CardTitle>
              <CardDescription>{t('card.emptyDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                {t('card.emptyTitle')}
              </div>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.statCard')}>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title={t('statCard.activeUsers')}
            value={t('statCard.activeUsersValue')}
            icon="group"
            trend={{ value: 12, label: t('statCard.trend') }}
          />
          <StatCard
            title={t('statCard.revenue')}
            value={t('statCard.revenueValue')}
            icon="payments"
            trend={{ value: -4, label: t('statCard.trend') }}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.table')}>
        <div className="w-full space-y-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('table.stateControls')}>
            {tableStates.map((state) => (
              <Button
                key={state}
                size="sm"
                variant={state === tableState ? 'primary' : 'secondary'}
                aria-pressed={state === tableState}
                onClick={() => {
                  setTableState(state)
                  setPage(1)
                }}
              >
                {t(`table.states.${state}`)}
              </Button>
            ))}
          </div>
          {tableState === 'error' && (
            <Alert variant="error" title={t('table.errorTitle')}>
              {t('table.errorDescription')}
            </Alert>
          )}
          <Card className="overflow-hidden">
            <DataTable
              data={tableState === 'data' ? rows : []}
              columns={columns}
              total={tableState === 'data' ? 12 : 0}
              page={page}
              limit={3}
              is_loading={tableState === 'loading'}
              empty_message={t('table.emptyMessage')}
              on_page_change={setPage}
            />
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.chart')}>
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('chart.lineTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={chartData}
                lines={[{ key: 'value', color: '#10b981', name: t('chart.value') }]}
                height={240}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('chart.barTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={chartData}
                bars={[{ key: 'signups', color: '#3b82f6', name: t('chart.signups') }]}
                height={240}
              />
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>
    </>
  )
}
