'use server'

import { revalidatePath } from 'next/cache'

export async function afterAuthMutation(path = '/dashboard') {
  revalidatePath(path)
}
