import { NextRequest } from 'next/server'
import { RoleController } from '@/modules/role/controller'

export async function GET(req: NextRequest) {
  return RoleController.GetRoles(req)
}

export async function POST(req: NextRequest) {
  return RoleController.CreateRole(req)
}
