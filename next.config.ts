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
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'"
    const upgradeInsecureRequests = isDev ? '' : '; upgrade-insecure-requests'

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
          {
            key: 'Content-Security-Policy',
            value:
              [
                "default-src 'self'",
                scriptSrc,
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https://i.pravatar.cc",
                connectSrc,
                "object-src 'none'",
                "manifest-src 'self'",
                "worker-src 'self' blob:",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                formAction,
              ].join('; ') + upgradeInsecureRequests,
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
