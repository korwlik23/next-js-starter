'use client'

import { useState } from 'react'
import { Button, Badge, Modal } from '@/components/ui'

// ────────────────────────────────────────
// Billing & Subscription Mockup Page
// ────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'เหมาะสำหรับเริ่มต้นใช้งาน',
    features: ['1 User', '100 API Calls / Month', 'Community Support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/ month',
    description: 'เหมาะสำหรับทีมขนาดเล็ก',
    features: ['5 Users', '10,000 API Calls / Month', 'Email Support', 'Advanced Analytics'],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'เหมาะสำหรับองค์กรขนาดใหญ่',
    features: [
      'Unlimited Users',
      'Unlimited API Calls',
      '24/7 Phone Support',
      'Dedicated Account Manager',
    ],
  },
]

const INVOICES = [
  { id: 'INV-2026-003', date: '01 Apr 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-002', date: '01 Mar 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-001', date: '01 Feb 2026', amount: '$29.00', status: 'Paid' },
]

export default function BillingPage() {
  const currentPlan = 'free' // ลองรับค่าจริงจาก API ในอนาคต
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleUpgradeClick = (planId: string) => {
    setSelectedPlan(planId)
    setIsUpgradeModalOpen(true)
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          plan: selectedPlan,
        }),
      })
      const data = await res.json()
      const checkoutUrl = data?.data?.url ?? data?.url

      if (data.success && checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        setErrorMessage(data.message ?? 'Payment initialization failed')
      }
    } catch {
      setErrorMessage('Something went wrong connecting to Stripe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-10 lg:flex lg:justify-between lg:items-end">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Billing & Subscription
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            จัดการแพ็กเกจ การใช้งาน และดูประวัติการชำระเงินของคุณ
          </p>
        </div>
      </header>

      {/* Current Plan Overview */}
      <section className="mb-12">
        <div className="editorial-card p-8 bg-[var(--color-surface-mid)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-2"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Current Plan
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-extrabold">
                  {currentPlan === 'free' ? 'Free' : 'Pro'} Plan
                </h2>
                <Badge variant={currentPlan === 'free' ? 'outline' : 'success'}>
                  {currentPlan === 'free' ? 'Basic' : 'Active'}
                </Badge>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                คุณกำลังใช้งานแพ็กเกจพื้นฐาน จำกัด 1 ผู้ใช้ และ 100 API Calls
              </p>
            </div>

            <div className="md:w-1/3">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>API Usage (85 / 100)</span>
                <span className="font-bold" style={{ color: 'var(--color-error)' }}>
                  85%
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-error)]" style={{ width: '85%' }} />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-faint)' }}>
                รีเซตในอีก 12 วัน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Plans */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-6">Upgrade to Pro</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border transition-all ${
                plan.isPopular
                  ? 'border-[var(--color-primary)] shadow-lg relative'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              }`}
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p
                className="text-sm mb-6 pb-6 border-b"
                style={{ color: 'var(--color-text-subtle)', borderColor: 'var(--color-border)' }}
              >
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: 'var(--color-success)' }}
                    >
                      check_circle
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={
                  currentPlan === plan.id ? 'outline' : plan.isPopular ? 'primary' : 'secondary'
                }
                className="w-full"
                disabled={currentPlan === plan.id}
                onClick={() => handleUpgradeClick(plan.id)}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Upgrade'}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Invoice History */}
      <section>
        <h3 className="text-xl font-bold mb-6">Invoice History</h3>
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <table className="w-full text-sm text-left">
            <thead
              className="bg-[var(--color-surface-mid)] text-xs uppercase"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice #</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--color-surface-low)] transition-colors">
                  <td className="px-6 py-4 font-medium">{inv.id}</td>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-muted)' }}>
                    {inv.date}
                  </td>
                  <td className="px-6 py-4">{inv.amount}</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">{inv.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="material-symbols-outlined text-lg hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upgrade Modal */}
      <Modal
        is_open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="ยืนยันการทำรายการ"
      >
        <div className="py-4">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            คุณกำลังจะเปลี่ยนแพ็กเกจเป็น <strong>{selectedPlan?.toUpperCase()}</strong>{' '}
            หากดำเนินการต่อ ระบบจะพาคุณไปยังหน้าชำระเงินของ Stripe เพื่อกรอกข้อมูลบัตรเครดิต
          </p>
          {errorMessage && (
            <p className="mb-4 text-sm" style={{ color: 'var(--color-error)' }}>
              {errorMessage}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsUpgradeModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" onClick={handleConfirmUpgrade} isLoading={isSubmitting}>
              ไปที่หน้าชำระเงิน
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
