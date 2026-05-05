'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateBilling() {
  revalidateTag('billing', 'max')
}
