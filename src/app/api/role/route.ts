import { NextRequest } from 'next/server'
import { RoleController } from '@/modules/role/controller'

// GET  /api/role  — รายการ Role ทั้งหมด
export async function GET(req: NextRequest) {
  return RoleController.GetRoles(req)
}

// POST /api/role  — สร้าง Role ใหม่
export async function POST(req: NextRequest) {
  return RoleController.CreateRole(req)
}
