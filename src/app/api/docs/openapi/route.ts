import { NextResponse } from 'next/server'
import { buildOpenApiSpec } from '@/lib/openapi'
import { withAuth } from '@/lib/authorize'
import { PERMISSIONS } from '@/constants'

export const GET = withAuth(
  async () =>
    NextResponse.json(buildOpenApiSpec(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    }),
  { permission: PERMISSIONS.ADMIN_ACCESS }
)
