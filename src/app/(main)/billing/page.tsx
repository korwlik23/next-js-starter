'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/apiClient'
import { Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'

// ────────────────────────────────────────
// Billing Page — เชื่อมกับ Stripe จริง
// แสดงแพลนปัจจุบัน + อัปเกรดผ่าน Stripe Checkout
// ────────────────────────────────────────

/** โครงสร้างข้อมูล subscription จาก API */
interface SubscriptionInfo {
  plan: string
  status: string
  current_period_end?: string
}

// แพลนที่รองรับในระบบ
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
        // ถ้า API error → แสดง free plan เป็น default
        setSubscription({ plan: 'free', status: 'active' })
      } finally {
        setIsLoading(false)
      }
    }

    FetchSubscription()
  }, [])

  // ── กดอัปเกรด → สร้าง Stripe Checkout Session
  const HandleUpgrade = useCallback(async (plan_slug: string) => {
    setUpgradingPlan(plan_slug)
    try {
      const result = await api.post<{ checkout_url?: string }>('/api/billing', {
        action: 'create_checkout',
        plan: plan_slug,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      // ── Redirect ไป Stripe Checkout (ถ้ามี URL)
      if (result.data?.checkout_url) {
        window.location.href = result.data.checkout_url
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
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Billing &amp; Subscription
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          จัดการแพลนสมาชิก, การชำระเงิน และดูประวัติบิลของคุณ
        </p>
      </div>

      {/* Current Plan Summary */}
      {is_loading ? (
        <Skeleton width="100%" height="6rem" border_radius="0.5rem" className="mb-8" />
      ) : (
        <div
          className="p-6 rounded-lg mb-8"
          style={{
            backgroundColor: 'var(--color-surface-mid)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-faint)' }}
              >
                แพลนปัจจุบัน
              </p>
              <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {current_plan.charAt(0).toUpperCase() + current_plan.slice(1)} Plan
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {current_plan === 'free'
                  ? 'คุณกำลังใช้แพลนฟรี — อัปเกรดเพื่อปลดล็อค features เพิ่มเติม'
                  : `แพลน ${current_plan} — ${subscription?.status ?? 'active'}`}
              </p>
            </div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-success, #27ae60)',
                color: 'white',
              }}
            >
              {subscription?.status === 'active' ? 'Active' : subscription?.status ?? 'Active'}
            </span>
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {PLAN_OPTIONS.map((plan) => {
          const is_current = current_plan === plan.slug

          return (
            <div
              key={plan.slug}
              className="relative p-6 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: plan.is_popular
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
              }}
            >
              {/* Popular badge */}
              {plan.is_popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                  }}
                >
                  แนะนำ
                </div>
              )}

              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {plan.name}
              </h3>

              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-2 mb-8">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: 'var(--color-success, #27ae60)' }}
                    >
                      check
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {is_current ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-md text-sm font-semibold opacity-50 cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-surface-mid)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  แพลนปัจจุบัน
                </button>
              ) : (
                <button
                  onClick={() => HandleUpgrade(plan.slug)}
                  disabled={upgrading_plan === plan.slug}
                  className="w-full py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                  }}
                >
                  {upgrading_plan === plan.slug
                    ? 'กำลังดำเนินการ...'
                    : `อัปเกรดเป็น ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          ประวัติบิล
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
                <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>วันที่</th>
                <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>รายการ</th>
                <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>จำนวนเงิน</th>
                <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-8"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  ยังไม่มีประวัติบิล
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
