import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const FALLBACK_SECRET = randomBytes(32).toString('hex')

function getSecret(): string {
  return (
    process.env.MEMCODE_REMOTE_PAIRING_SECRET ||
    process.env.REMOTE_PAIRING_SECRET ||
    process.env.JWT_SECRET ||
    FALLBACK_SECRET
  )
}

function getKey(): Buffer {
  return createHash('sha256').update(getSecret()).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, 'base64url')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}
