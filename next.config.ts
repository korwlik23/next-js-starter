import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// ────────────────────────────────────────
// สร้าง next-intl plugin — ชี้ไปที่ไฟล์ request config
// ────────────────────────────────────────
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  // @ts-expect-error - allowedDevOrigins is required by the dev server but may not be in the experimental types
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.1.155:3000'],
}

export default withNextIntl(nextConfig)
