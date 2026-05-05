import { NextRequest } from 'next/server'
import { RoleController } from '@/modules/role/controller'

interface Params {
  params: Promise<{ id: string }>
}

// GET   /api/role/[id]  — ดูข้อมูล Role + Permissions
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.GetRole(req, id)
}

// PATCH /api/role/[id]  — แก้ไข Role (ชื่อ, description, สิทธิ์)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.UpdateRole(req, id)
}

// DELETE /api/role/[id] — ลบ Role
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.DeleteRole(req, id)
}
