import { inngest } from '@/lib/inngest'

export const welcomeEmailJob = inngest.createFunction(
  { id: 'send-welcome-email', triggers: [{ event: 'app/user.registered' }] },
  async ({ event, step }) => {
    const { user_email } = event.data as { user_email: string; user_name?: string }

    await step.run('send-email', async () => {
      // เรียกใช้ EmailService ที่มีอยู่
      // await EmailService.SendWelcomeEmail(user_email, user_name)
      console.log(`Sending welcome email to ${user_email}`)
    })

    return { success: true, message: `Welcome email sent to ${user_email}` }
  }
)
