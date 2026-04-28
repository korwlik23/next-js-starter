import { NextRequest } from 'next/server'
import { FeatureFlagController } from '@/modules/feature/controller'

// ────────────────────────────────────────
// GET /api/admin/features — ดึง feature flags ทั้งหมด
// PATCH /api/admin/features — อัปเดต feature flag
// ────────────────────────────────────────

export async function GET() {
  return FeatureFlagController.GetAll()
}

export async function PATCH(req: NextRequest) {
  return FeatureFlagController.Update(req)
}
