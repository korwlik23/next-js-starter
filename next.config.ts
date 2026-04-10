import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// ────────────────────────────────────────
// สร้าง next-intl plugin — ชี้ไปที่ไฟล์ request config
// ────────────────────────────────────────
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
}

export default withNextIntl(nextConfig)
