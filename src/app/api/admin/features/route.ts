import { NextRequest } from 'next/server'
import { FeatureFlagController } from '@/modules/feature/controller'

export async function GET(req: NextRequest) {
  return FeatureFlagController.GetAll(req)
}

export async function PATCH(req: NextRequest) {
  return FeatureFlagController.Update(req)
}
