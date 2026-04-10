import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_db: !!process.env.DATABASE_URL,
    env_jwt: !!process.env.JWT_SECRET,
  }

  try {
    const userCount = await prisma.user.count()
    checks.db_connected = true
    checks.user_count = userCount
  } catch (err) {
    checks.db_connected = false
    checks.db_error = err instanceof Error ? err.message : String(err)
  }

  try {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('test', 4)
    const match = await bcrypt.compare('test', hash)
    checks.bcrypt_works = match
  } catch (err) {
    checks.bcrypt_works = false
    checks.bcrypt_error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(checks)
}
