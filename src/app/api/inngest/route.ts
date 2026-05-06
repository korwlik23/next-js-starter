import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { welcomeEmailJob } from '@/modules/jobs/welcome-email'

// สร้าง API Handler สำหรับ Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [welcomeEmailJob],
})
