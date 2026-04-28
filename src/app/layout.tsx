import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { QueryProvider } from '@/components/layout/QueryProvider'
import '@/app/globals.css'

// ────────────────────────────────────────
// Root Metadata — SEO + OpenGraph + Twitter
// ตั้งค่าครั้งเดียวที่ root layout
// ────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const SITE_NAME = 'Next.js Starter'
const SITE_DESCRIPTION =
  'Ultimate Next.js Fullstack Starter Template — SaaS & Enterprise Ready with RBAC, Multi-tenant, Stripe Billing'

export const metadata: Metadata = {
  // Title template สำหรับทุกหน้า
  title: {
    template: `%s — ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  // Canonical URL ป้องกัน duplicate content
  metadataBase: new URL(SITE_URL),
  // Open Graph — สำหรับ Link Preview บน Social Media
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: {
      template: `%s — ${SITE_NAME}`,
      default: SITE_NAME,
    },
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'th_TH',
    alternateLocale: ['en_US'],
  },
  // Twitter Card — สำหรับ Preview บน Twitter/X
  twitter: {
    card: 'summary_large_image',
    title: {
      template: `%s — ${SITE_NAME}`,
      default: SITE_NAME,
    },
    description: SITE_DESCRIPTION,
  },
  // ห้าม index หน้า dev ที่ไม่ใช่ production
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // โหลด locale และ messages จาก server
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        {/* JSON-LD Structured Data สำหรับ SEO รูปแบบ Organization / WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              publisher: {
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
              },
            }),
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
