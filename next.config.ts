import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// ────────────────────────────────────────
// สร้าง next-intl plugin — ชี้ไปที่ไฟล์ request config
// ────────────────────────────────────────
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const isDev = process.env.NODE_ENV !== 'production'
const localDevHttpOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.155:3000',
]
const localDevWsOrigins = ['ws://localhost:3000', 'ws://127.0.0.1:3000', 'ws://192.168.1.155:3000']

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const connectSrc = isDev
      ? ["connect-src 'self'", ...localDevHttpOrigins, ...localDevWsOrigins].join(' ')
      : "connect-src 'self'"
    const formAction = isDev
      ? ["form-action 'self'", ...localDevHttpOrigins].join(' ')
      : "form-action 'self'"

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://i.pravatar.cc",
              connectSrc,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              formAction,
            ].join('; '),
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.1.155:3000'],
}

export default withNextIntl(nextConfig)
