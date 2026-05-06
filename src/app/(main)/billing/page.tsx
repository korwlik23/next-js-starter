'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'

interface SubscriptionInfo {
  plan: string
  status: string
  current_period_start?: string | null
  current_period_end?: string
  cancel_at_period_end?: boolean
  stripe_customer_id?: string | null
  invoices?: {
    id: string
    amount: number
    status: string
    created_at: string
    pdf_url?: string
  }[]
}

export default function BillingPage() {
  const t = useTranslations('billingPage')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const formatterLocale = locale === 'th' ? 'th-TH' : 'en-US'
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(formatterLocale, {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }),
    [formatterLocale]
  )

  const planOptions = useMemo(
    () => [
      {
        name: 'Free',
        slug: 'free',
        price: currencyFormatter.format(0),
        period: t('monthly'),
        features: [t('features.freeUsers'), t('features.freeProjects'), t('features.freeUpload')],
      },
      {
        name: 'Pro',
        slug: 'pro',
        price: currencyFormatter.format(590),
        period: t('monthly'),
        features: [
          t('features.proUsers'),
          t('features.proProjects'),
          t('features.customDomain'),
          t('features.apiAccess'),
          t('features.auditLog'),
          t('features.analytics'),
          t('features.webhook'),
          t('features.proUpload'),
        ],
        isPopular: true,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        price: currencyFormatter.format(2990),
        period: t('monthly'),
        features: [
          t('features.enterpriseUsers'),
          t('features.enterpriseProjects'),
          t('features.allPro'),
          t('features.sso'),
          t('features.prioritySupport'),
          t('features.enterpriseUpload'),
        ],
      },
    ],
    [currencyFormatter, t]
  )

  useEffect(() => {
    async function fetchSubscription() {
      setIsLoading(true)
      try {
        const result = await api.get<SubscriptionInfo>('/api/billing')
        if (result.data) {
          setSubscription(result.data)
          setErrorMessage('')
        } else {
          setSubscription(null)
          setErrorMessage(result.error ?? t('loadError'))
        }
      } catch {
        setSubscription(null)
        setErrorMessage(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [t])

  const handleUpgrade = useCallback(
    async (planSlug: string) => {
      setUpgradingPlan(planSlug)
      try {
        const result = await api.post<{ url?: string; checkout_url?: string }>('/api/billing', {
          action: 'checkout',
          plan: planSlug,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        const checkoutUrl = result.data?.url ?? result.data?.checkout_url
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          toast.success(t('switchedPlan', { plan: planSlug }))
          setSubscription((prev) => (prev ? { ...prev, plan: planSlug } : null))
        }
      } catch {
        toast.error(t('actionError'))
      } finally {
        setUpgradingPlan(null)
      }
    },
    [t]
  )

  const handleManageBilling = useCallback(async () => {
    setIsPortalLoading(true)
    try {
      const result = await api.post<{ url?: string }>('/api/billing', {
        action: 'portal',
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.url) {
        window.location.href = result.data.url
      } else {
        toast.error(t('portalUnavailable'))
      }
    } catch {
      toast.error(t('portalError'))
    } finally {
      setIsPortalLoading(false)
    }
  }, [t])

  const currentPlan = subscription?.plan
  const displayPlan = currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : ''

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="mb-10 pt-4">
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('title')}
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          {t('description')}
        </p>
      </header>

      {errorMessage && (
        <div className="mb-8 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-4 text-sm font-medium text-[var(--color-error)]">
          {errorMessage}
        </div>
      )}

      <div className="mb-12">
        {isLoading ? (
          <Skeleton width="100%" height="120px" border_radius="var(--radius-lg)" />
        ) : (
          <div
            className="editorial-card-elevated p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm border-[var(--color-primary)]/10"
            style={{ backgroundColor: 'var(--color-surface-low)' }}
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg shadow-black/5">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-1"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  {t('currentStatus')}
                </p>
                <div className="flex items-center gap-3">
                  <h2
                    className="text-2xl font-black tracking-tight"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {currentPlan ? t('planLabel', { plan: displayPlan }) : t('billingUnavailable')}
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                    {subscription?.status?.toUpperCase() ?? tStatus('unavailable')}
                  </span>
                </div>
                <p
                  className="text-xs font-medium mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {subscription?.current_period_end
                    ? t('renewsOn', {
                        date: new Date(subscription.current_period_end).toLocaleDateString(
                          formatterLocale,
                          { dateStyle: 'long' }
                        ),
                      })
                    : subscription
                      ? t('noActivePeriod')
                      : t('apiUnavailable')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={isPortalLoading || !subscription}
              className="btn-secondary text-[10px] py-2.5 px-6 rounded-md uppercase font-black tracking-widest"
            >
              {isPortalLoading ? t('opening') : t('manageBilling')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
        {planOptions.map((plan) => {
          const isCurrent = currentPlan === plan.slug
          const isPro = plan.slug === 'pro'

          return (
            <div
              key={plan.slug}
              className={`editorial-card-elevated p-4 sm:p-5 flex flex-col transition-all duration-300 ${isPro ? 'border-[var(--color-primary)]/40 shadow-md shadow-black/5' : 'shadow-sm'}`}
            >
              {plan.isPopular && (
                <span className="text-[9px] font-black uppercase tracking-widest text-center px-3 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] absolute -top-3 left-1/2 -translate-x-1/2">
                  {t('recommended')}
                </span>
              )}
              <h3
                className="text-sm font-black uppercase tracking-widest mb-6"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                  {plan.price}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-faint)' }}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-xs font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span className="material-symbols-outlined text-sm text-[var(--color-success)] mt-0.5">
                      check_circle
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.slug)}
                disabled={
                  !subscription || isCurrent || plan.slug === 'free' || upgradingPlan === plan.slug
                }
                className={`w-full py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isCurrent ? 'bg-[var(--color-surface-mid)] text-[var(--color-text-faint)]' : 'btn-primary'}`}
              >
                {!subscription
                  ? tStatus('unavailable')
                  : isCurrent
                    ? t('currentPlan')
                    : plan.slug === 'free'
                      ? t('included')
                      : upgradingPlan === plan.slug
                        ? tStatus('processing')
                        : t('switchTo', { plan: plan.name })}
              </button>
            </div>
          )
        })}
      </div>

      <section className="editorial-card-elevated overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
              {t('billingHistory')}
            </h2>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
              {t('historyDescription')}
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">
            {t('pdfFormat')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-low)]/50">
                <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-black uppercase text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  {t('date')}
                </th>
                <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-black uppercase text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  {t('descriptionColumn')}
                </th>
                <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-black uppercase text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  {t('amount')}
                </th>
                <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-black uppercase text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  {t('status')}
                </th>
                <th className="text-right px-4 sm:px-5 py-3 text-[10px] font-black uppercase text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  {t('action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {subscription?.invoices && subscription.invoices.length > 0 ? (
                subscription.invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="group hover:bg-[var(--color-surface-low)] transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-4 font-medium whitespace-nowrap">
                      {new Date(invoice.created_at).toLocaleDateString(formatterLocale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 sm:px-5 py-4 font-medium">{t('standardSubscription')}</td>
                    <td
                      className="px-4 sm:px-5 py-4 font-bold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {currencyFormatter.format(invoice.amount)}
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                          invoice.status === 'paid'
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20'
                            : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-4 text-right">
                      {invoice.pdf_url ? (
                        <a
                          href={invoice.pdf_url}
                          className="text-[var(--color-primary)] hover:underline text-xs font-bold flex items-center justify-end gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>{' '}
                          {t('receipt')}
                        </a>
                      ) : (
                        <span className="text-[var(--color-text-faint)] text-xs font-medium italic">
                          {tStatus('processing')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--color-text-faint)]">
                          receipt_long
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-text-faint)]">
                        {t('noHistory')}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
