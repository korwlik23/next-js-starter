'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateUsers() {
  revalidateTag('users', 'max')
}
