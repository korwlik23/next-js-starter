'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'

// ────────────────────────────────────────
// Billing Page — เชื่อมกับ Stripe จริง
// ────────────────────────────────────────

interface SubscriptionInfo {
  plan: string
  status: string
  current_period_end?: string
  invoices?: {
    id: string
    amount: number
    status: string
    created_at: string
    pdf_url?: string
  }[]
}

const PLAN_OPTIONS = [
  {
    name: 'Free',
    slug: 'free',
    price: '฿0',
    period: '/เดือน',
    features: ['ผู้ใช้สูงสุด 3 คน', 'โปรเจคสูงสุด 5 โปรเจค', 'อัปโหลดไฟล์สูงสุด 10MB'],
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '฿590',
    period: '/เดือน',
    features: [
      'ผู้ใช้สูงสุด 20 คน',
      'โปรเจคสูงสุด 50 โปรเจค',
      'Custom Domain',
      'API Access',
      'Audit Log',
      'Analytics',
      'Webhook',
      'อัปโหลดไฟล์สูงสุด 100MB',
    ],
    is_popular: true,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: '฿2,990',
    period: '/เดือน',
    features: [
      'ผู้ใช้ไม่จำกัด',
      'โปรเจคไม่จำกัด',
      'ทุกอย่างใน Pro',
      'SSO / SAML',
      'Priority Support',
      'อัปโหลดไฟล์สูงสุด 500MB',
    ],
  },
]

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [is_loading, setIsLoading] = useState(true)
  const [upgrading_plan, setUpgradingPlan] = useState<string | null>(null)

  // ── ดึงข้อมูล subscription ปัจจุบันจาก API
  useEffect(() => {
    async function FetchSubscription() {
      setIsLoading(true)
      try {
        const result = await api.get<SubscriptionInfo>('/api/billing')
        if (result.data) {
          setSubscription(result.data)
        }
      } catch {
        setSubscription({ plan: 'free', status: 'active' })
      } finally {
        setIsLoading(false)
      }
    }

    FetchSubscription()
  }, [])

  const HandleUpgrade = useCallback(async (plan_slug: string) => {
    setUpgradingPlan(plan_slug)
    try {
      const result = await api.post<{ url?: string; checkout_url?: string }>('/api/billing', {
        action: 'checkout',
        plan: plan_slug,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      const checkoutUrl = result.data?.url ?? result.data?.checkout_url
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.success(`เปลี่ยนแพลนเป็น ${plan_slug} สำเร็จ`)
        setSubscription((prev) => (prev ? { ...prev, plan: plan_slug } : null))
      }
    } catch {
      toast.error('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUpgradingPlan(null)
    }
  }, [])

  const current_plan = subscription?.plan ?? 'free'

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* 1. PAGE HEADER — Focus Point */}
      <header className="mb-10 pt-4">
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          Subscription & Billing
        </h1>
        <p className="text-base font-medium max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          Manage your billing information, subscription plans, and view your payment history.
        </p>
      </header>

      {/* 2. CURRENT SUBSCRIPTION — Primary Information */}
      <div className="mb-12">
        {is_loading ? (
          <Skeleton width="100%" height="120px" border_radius="var(--radius-lg)" />
        ) : (
          <div
            className="editorial-card-elevated p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border-[var(--color-primary)]/10"
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
                  Current Status
                </p>
                <div className="flex items-center gap-3">
                  <h2
                    className="text-2xl font-black tracking-tight"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {current_plan.charAt(0).toUpperCase() + current_plan.slice(1)} Plan
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                    {subscription?.status?.toUpperCase() ?? 'ACTIVE'}
                  </span>
                </div>
                <p
                  className="text-xs font-medium mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {subscription?.current_period_end
                    ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { dateStyle: 'long' })}`
                    : 'Unlock more features with a Pro plan'}
                </p>
              </div>
            </div>
            <Link
              href="/billing/manage"
              className="btn-secondary text-[10px] py-2.5 px-6 rounded-md uppercase font-black tracking-widest"
            >
              Manage Billing
            </Link>
          </div>
        )}
      </div>

      {/* 3. PRICING TIERS — Choice Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {PLAN_OPTIONS.map((plan) => {
          const is_current = current_plan === plan.slug
          const is_pro = plan.slug === 'pro'

          return (
            <div
              key={plan.slug}
              className={`editorial-card-elevated p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${is_pro ? 'border-[var(--color-primary)]/40 shadow-xl shadow-black/5' : 'shadow-sm'}`}
            >
              {is_pro && (
                <span className="text-[9px] font-black uppercase tracking-widest text-center px-3 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] absolute -top-3 left-1/2 -translate-x-1/2">
                  Recommended
                </span>
              )}
              <h3
                className="text-sm font-black uppercase tracking-widest mb-6"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span
                  className="text-4xl font-black tracking-tighter"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {plan.price}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-faint)' }}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
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
                onClick={() => HandleUpgrade(plan.slug)}
                disabled={is_current || upgrading_plan === plan.slug}
                className={`w-full py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${is_current ? 'bg-[var(--color-surface-mid)] text-[var(--color-text-faint)]' : 'btn-primary'}`}
              >
                {is_current
                  ? 'Current Plan'
                  : upgrading_plan === plan.slug
                    ? 'Processing...'
                    : `Switch to ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* 4. BILLING HISTORY — Supporting Data Table */}
      <section className="editorial-card-elevated overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-surface-low)]/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
              Billing History
            </h2>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
              Download and manage your past invoices.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">
            PDF Format
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-low)]/50">
                <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  Date
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  Description
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  Amount
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  Status
                </th>
                <th className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {subscription?.invoices && subscription.invoices.length > 0 ? (
                subscription.invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="group hover:bg-[var(--color-surface-low)] transition-colors"
                  >
                    <td className="px-8 py-5 font-medium whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-8 py-5 font-medium">Standard Subscription</td>
                    <td className="px-8 py-5 font-bold" style={{ color: 'var(--color-primary)' }}>
                      ฿{inv.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                          inv.status === 'paid'
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20'
                            : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {inv.pdf_url ? (
                        <a
                          href={inv.pdf_url}
                          className="text-[var(--color-primary)] hover:underline text-xs font-bold flex items-center justify-end gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>{' '}
                          Receipt
                        </a>
                      ) : (
                        <span className="text-[var(--color-text-faint)] text-xs font-medium italic">
                          Processing
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
                        No billing history available
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
