import prisma from '@/lib/prisma'

export class HealthService {
  static async checkSystemHealth() {
    const checks: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      env_db: !!process.env.DATABASE_URL,
      env_jwt: !!process.env.JWT_SECRET,
    }

    try {
      await prisma.$queryRaw`SELECT 1`
      checks.db_connected = true
    } catch (err) {
      checks.db_connected = false
      if (process.env.NODE_ENV !== 'production') {
        checks.db_error = err instanceof Error ? err.message : String(err)
      }
    }

    try {
      const bcrypt = await import('bcryptjs')
      const hash = await bcrypt.hash('test', 4)
      const match = await bcrypt.compare('test', hash)
      checks.bcrypt_works = match
    } catch (err) {
      checks.bcrypt_works = false
      if (process.env.NODE_ENV !== 'production') {
        checks.bcrypt_error = err instanceof Error ? err.message : String(err)
      }
    }

    return checks
  }
}
