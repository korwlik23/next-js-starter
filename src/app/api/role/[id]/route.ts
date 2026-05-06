import { NextRequest } from 'next/server'
import { RoleController } from '@/modules/role/controller'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.GetRole(req, id)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.UpdateRole(req, id)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  return RoleController.DeleteRole(req, id)
}
