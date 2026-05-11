import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_STEP_SECONDS = 30
const TOTP_DIGITS = 6

function getEncryptionKey() {
  return createHash('sha256')
    .update(process.env.JWT_SECRET || 'development-secret')
    .digest()
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`
}

export function decryptSecret(encrypted: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = encrypted.split('.')
  if (!ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error('Invalid encrypted secret')
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivRaw, 'base64'))
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, 'base64')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

export function base32Encode(buffer: Buffer) {
  let bits = ''
  let output = ''

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0')
  }

  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0')
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)]
  }

  return output
}

export function base32Decode(value: string) {
  const sanitized = value.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()
  let bits = ''

  for (const char of sanitized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) throw new Error('Invalid base32 value')
    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2))
  }

  return Buffer.from(bytes)
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20))
}

function hotp(secret: string, counter: number) {
  const key = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

function constantTimeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
}

export function verifyTotpCode(secret: string, code: string, window = 1) {
  const sanitizedCode = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(sanitizedCode)) return false

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS)
  for (let offset = -window; offset <= window; offset++) {
    if (constantTimeEqual(hotp(secret, currentCounter + offset), sanitizedCode)) {
      return true
    }
  }

  return false
}

export function buildTotpUri({
  issuer,
  accountName,
  secret,
}: {
  issuer: string
  accountName: string
  secret: string
}) {
  const label = encodeURIComponent(`${issuer}:${accountName}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  })

  return `otpauth://totp/${label}?${params.toString()}`
}

export function hashRecoveryCode(code: string) {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const raw = base32Encode(randomBytes(10)).slice(0, 10)
    return `${raw.slice(0, 5)}-${raw.slice(5)}`
  })
}
