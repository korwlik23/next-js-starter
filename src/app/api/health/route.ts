import { NextResponse } from 'next/server'
import { HealthService } from '@/modules/health/service'

export async function GET() {
  const checks = await HealthService.checkSystemHealth()
  return NextResponse.json(checks)
}
