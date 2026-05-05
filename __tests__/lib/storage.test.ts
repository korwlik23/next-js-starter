import { CreateSignedStorageUrl, VerifySignedStorageUrl } from '@/lib/storage'

describe('storage signed URLs', () => {
  const originalStorageSecret = process.env.STORAGE_SIGNING_SECRET
  const originalJwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.STORAGE_SIGNING_SECRET = 'test-storage-secret-with-at-least-32-chars'
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-chars'
  })

  afterEach(() => {
    process.env.STORAGE_SIGNING_SECRET = originalStorageSecret
    process.env.JWT_SECRET = originalJwtSecret
  })

  it('creates verifiable signed storage URLs', () => {
    const signedUrl = CreateSignedStorageUrl('uploads/file.pdf', 60)
    const url = new URL(`http://localhost:3000${signedUrl}`)

    expect(
      VerifySignedStorageUrl({
        key: url.searchParams.get('key') ?? '',
        expires: url.searchParams.get('expires'),
        signature: url.searchParams.get('signature'),
      })
    ).toBe(true)
  })

  it('rejects tampered keys', () => {
    const signedUrl = CreateSignedStorageUrl('uploads/file.pdf', 60)
    const url = new URL(`http://localhost:3000${signedUrl}`)

    expect(
      VerifySignedStorageUrl({
        key: 'uploads/other.pdf',
        expires: url.searchParams.get('expires'),
        signature: url.searchParams.get('signature'),
      })
    ).toBe(false)
  })
})
