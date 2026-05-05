'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateTenants() {
  revalidateTag('tenants', 'max')
}
