// ────────────────────────────────────────
// API Key — ระบบจัดการ API Key
// สร้าง, ตรวจสอบ, และจัดการ API keys สำหรับ external access
// ────────────────────────────────────────

import prisma from '@/lib/prisma'
import { GenerateId } from '@/lib/ulid'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

/** Prefix สำหรับ API key เพื่อ identify ได้ง่าย */
const API_KEY_PREFIX = 'nsk_'

/**
 * สร้าง API key ใหม่ — return raw key (แสดงแค่ครั้งเดียว) + hashed version สำหรับเก็บ DB
 */
export function GenerateApiKey(): { raw_key: string; hashed_key: string } {
  // สร้าง random key 32 bytes
  const random_bytes = crypto.randomBytes(32).toString('hex')
  const raw_key = `${API_KEY_PREFIX}${random_bytes}`

  // Hash key สำหรับเก็บใน database (ไม่เก็บ raw)
  const hashed_key = crypto.createHash('sha256').update(raw_key).digest('hex')

  return { raw_key, hashed_key }
}

/**
 * Hash API key สำหรับเปรียบเทียบกับที่เก็บใน DB
 */
export function HashApiKey(raw_key: string): string {
  return crypto.createHash('sha256').update(raw_key).digest('hex')
}

/**
 * สร้าง API key ใหม่ให้ tenant
 */
export async function CreateApiKey(
  tenant_id: string,
  name: string,
  created_by: string
): Promise<{ id: string; raw_key: string; name: string }> {
  const { raw_key, hashed_key } = GenerateApiKey()

  const api_key = await prisma.apiKey.create({
    data: {
      id: GenerateId(),
      tenantId: tenant_id,
      name,
      hashedKey: hashed_key,
      prefix: raw_key.substring(0, 12), // เก็บ prefix ไว้สำหรับแสดงผล
      createdBy: created_by,
    },
  })

  logger.info(`[ApiKey] Created API key '${name}' for tenant ${tenant_id}`)

  return { id: api_key.id, raw_key, name }
}

/**
 * ตรวจสอบ API key — return tenant_id ถ้า valid
 */
export async function ValidateApiKey(raw_key: string): Promise<{
  is_valid: boolean
  tenant_id?: string
  api_key_id?: string
}> {
  // ตรวจสอบ prefix
  if (!raw_key.startsWith(API_KEY_PREFIX)) {
    return { is_valid: false }
  }

  const hashed = HashApiKey(raw_key)

  const api_key = await prisma.apiKey.findUnique({
    where: { hashedKey: hashed },
  })

  if (!api_key || !api_key.isActive || (api_key.expiresAt && api_key.expiresAt < new Date())) {
    return { is_valid: false }
  }

  // อัพเดต lastUsedAt
  await prisma.apiKey.update({
    where: { id: api_key.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    is_valid: true,
    tenant_id: api_key.tenantId,
    api_key_id: api_key.id,
  }
}

/**
 * ลบ (revoke) API key
 */
export async function RevokeApiKey(api_key_id: string, tenant_id?: string): Promise<boolean> {
  try {
    const result = await prisma.apiKey.updateMany({
      where: { id: api_key_id, ...(tenant_id ? { tenantId: tenant_id } : {}) },
      data: { isActive: false },
    })
    if (result.count === 0) return false
    logger.info(`[ApiKey] Revoked API key ${api_key_id}`)
    return true
  } catch {
    return false
  }
}

/**
 * ดึงรายการ API keys ของ tenant (ไม่แสดง hashed key)
 */
export async function ListApiKeys(tenant_id: string) {
  return prisma.apiKey.findMany({
    where: { tenantId: tenant_id },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
