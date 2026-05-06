import { appConfig } from './app.config'

export const seoConfig = {
  defaultTitle: appConfig.name,
  titleTemplate: `%s | ${appConfig.name}`,
  description: appConfig.description,
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: appConfig.url,
    siteName: appConfig.name,
    images: [
      {
        url: `${appConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: appConfig.name,
      },
    ],
  },
  twitter: {
    handle: '@nextjs_starter',
    site: '@nextjs_starter',
    cardType: 'summary_large_image',
  },
} as const
