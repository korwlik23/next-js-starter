import {
  base32Decode,
  base32Encode,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '@/lib/totp'

describe('TOTP helpers', () => {
  it('round-trips base32 encoded secrets', () => {
    const input = Buffer.from('starter-secret')
    const encoded = base32Encode(input)

    expect(base32Decode(encoded).toString('utf8')).toBe('starter-secret')
  })

  it('encrypts and decrypts MFA secrets', () => {
    const encrypted = encryptSecret('ABCDEF234567')

    expect(encrypted).not.toBe('ABCDEF234567')
    expect(decryptSecret(encrypted)).toBe('ABCDEF234567')
  })

  it('creates hashable recovery codes', () => {
    const [code] = generateRecoveryCodes(1)

    expect(code).toMatch(/^[A-Z2-7]{5}-[A-Z2-7]{5}$/)
    expect(hashRecoveryCode(code)).toBe(hashRecoveryCode(code.toLowerCase()))
  })
})
