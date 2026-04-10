// ─────────────────────────────────────────
// STRIPE CONFIGURATION (Placeholder)
// ─────────────────────────────────────────
// TODO: ติดตั้ง stripe sdk
// npm install stripe

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'test') {
  // ไม่โยน Error เพื่อหลีกเลี่ยง Build Type Check
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Please set it in your .env file.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2026-03-25.dahlia', // แก้ให้ตรงกับ Type declaration ของ sdk ในระบบ
  appInfo: {
    name: 'Next.js Starter SaaS',
    version: '0.1.0',
  },
})

/**
 * Get Stripe Client Instance
 * สามารถใช้เพื่อเรียกใช้งาน Stripe API ได้โดยตรง
 */
export const GetStripeClient = () => {
  return stripe
}

