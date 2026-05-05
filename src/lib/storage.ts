import crypto from 'crypto'
import path from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export type StorageDisk = 'local' | 's3'
export type StorageVisibility = 'public' | 'private'

export interface StoredObject {
  disk: StorageDisk
  key: string
  url: string | null
  visibility: StorageVisibility
  checksum: string
}

export interface StorageObjectBody {
  body: Buffer
  contentType?: string
}

const LOCAL_PUBLIC_ROOT = path.join(process.cwd(), 'public')
const LOCAL_PRIVATE_ROOT = path.join(process.cwd(), 'storage', 'private')
const SIGNED_URL_PATH = '/api/storage/file'

function getStorageConfig() {
  const region = process.env.S3_REGION || process.env.AWS_REGION
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET

  if (region && accessKeyId && secretAccessKey && bucket) {
    return {
      disk: 's3' as const,
      region,
      accessKeyId,
      secretAccessKey,
      bucket,
      endpoint: process.env.S3_ENDPOINT,
      publicUrl: process.env.NEXT_PUBLIC_STORAGE_URL,
    }
  }

  return { disk: 'local' as const }
}

function getS3Client(config: Extract<ReturnType<typeof getStorageConfig>, { disk: 's3' }>) {
  return new S3Client({
    region: config.region,
    ...(config.endpoint && { endpoint: config.endpoint }),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

function sanitizeKey(key: string) {
  const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid storage key')
  }
  return normalized
}

function getLocalPath(key: string, visibility: StorageVisibility) {
  const safeKey = sanitizeKey(key)
  const root = visibility === 'public' ? LOCAL_PUBLIC_ROOT : LOCAL_PRIVATE_ROOT
  const filePath = path.join(root, safeKey)
  const resolvedRoot = path.resolve(root)
  const resolvedFile = path.resolve(filePath)

  if (!resolvedFile.startsWith(resolvedRoot)) {
    throw new Error('Invalid storage path')
  }

  return resolvedFile
}

function getSigningSecret() {
  const secret = process.env.STORAGE_SIGNING_SECRET || process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('STORAGE_SIGNING_SECRET or JWT_SECRET must contain at least 32 characters')
  }
  return secret
}

function signStorageUrlPayload(key: string, expiresAt: number) {
  return crypto.createHmac('sha256', getSigningSecret()).update(`${key}.${expiresAt}`).digest('hex')
}

async function readS3Body(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0)
  if (body instanceof Uint8Array) return Buffer.from(body)

  const stream = body as AsyncIterable<Uint8Array>
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export function CreateStorageKey(originalName: string, id: string) {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin'
  return `uploads/${id}.${extension}`
}

export async function PutStorageObject(input: {
  key: string
  body: Buffer
  contentType: string
  visibility?: StorageVisibility
}): Promise<StoredObject> {
  const key = sanitizeKey(input.key)
  const visibility = input.visibility ?? 'public'
  const checksum = crypto.createHash('sha256').update(input.body).digest('hex')
  const config = getStorageConfig()

  if (config.disk === 's3') {
    await getS3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      })
    )

    const publicUrl =
      visibility === 'public'
        ? `${config.publicUrl || `https://${config.bucket}.s3.${config.region}.amazonaws.com`}/${key}`
        : null

    return { disk: 's3', key, url: publicUrl, visibility, checksum }
  }

  const filePath = getLocalPath(key, visibility)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, input.body)

  return {
    disk: 'local',
    key,
    url: visibility === 'public' ? `/${key}` : null,
    visibility,
    checksum,
  }
}

export async function GetStorageObject(key: string): Promise<StorageObjectBody> {
  const safeKey = sanitizeKey(key)
  const config = getStorageConfig()

  if (config.disk === 's3') {
    const response = await getS3Client(config).send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: safeKey,
      })
    )

    return {
      body: await readS3Body(response.Body),
      contentType: response.ContentType,
    }
  }

  const publicPath = getLocalPath(safeKey, 'public')
  const privatePath = getLocalPath(safeKey, 'private')

  try {
    return { body: await readFile(privatePath) }
  } catch {
    return { body: await readFile(publicPath) }
  }
}

export function CreateSignedStorageUrl(key: string, expiresInSeconds = 300) {
  const safeKey = sanitizeKey(key)
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = signStorageUrlPayload(safeKey, expiresAt)
  const params = new URLSearchParams({
    key: safeKey,
    expires: String(expiresAt),
    signature,
  })

  return `${SIGNED_URL_PATH}?${params.toString()}`
}

export function VerifySignedStorageUrl(input: {
  key: string
  expires: string | null
  signature: string | null
}) {
  if (!input.expires || !input.signature) return false

  const key = sanitizeKey(input.key)
  const expiresAt = Number(input.expires)
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false
  }

  const expected = signStorageUrlPayload(key, expiresAt)
  if (expected.length !== input.signature.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature))
}
