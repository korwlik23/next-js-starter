import { BuildAppRedirectUrl } from '@/lib/app-url'

jest.mock('@/config/app.config', () => ({
  appConfig: { url: 'https://app.example.com' },
}))

// คำขอที่วิ่งผ่าน reverse proxy เข้า container — Next เห็น host ภายใน ไม่ใช่โดเมนจริง
const INTERNAL_REQUEST_URL = 'https://0.0.0.0:3000/api/auth/refresh'

describe('BuildAppRedirectUrl', () => {
  afterEach(() => jest.restoreAllMocks())

  describe('in production', () => {
    beforeEach(() => {
      jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' })
    })

    it('uses the configured public origin instead of the internal request host', () => {
      const url = BuildAppRedirectUrl('/dashboard', INTERNAL_REQUEST_URL)
      expect(url.toString()).toBe('https://app.example.com/dashboard')
    })

    it('keeps the query string of the path', () => {
      const url = BuildAppRedirectUrl('/login?error=invalid', INTERNAL_REQUEST_URL)
      expect(url.toString()).toBe('https://app.example.com/login?error=invalid')
    })

    it.each(['https://evil.example/phish', '//evil.example/phish', 'dashboard', ''])(
      'falls back to the app root for a non-relative path %p (no open redirect)',
      (path) => {
        const url = BuildAppRedirectUrl(path, INTERNAL_REQUEST_URL)
        expect(url.toString()).toBe('https://app.example.com/')
      }
    )
  })

  describe('outside production', () => {
    it('follows the request origin so LAN / custom dev hosts keep their cookies', () => {
      const url = BuildAppRedirectUrl('/dashboard', 'http://192.168.1.155:3000/api/auth/login')
      expect(url.toString()).toBe('http://192.168.1.155:3000/dashboard')
    })
  })
})
