import { NextResponse } from 'next/server'
import { QueueService } from '@/lib/queue'
import { ProcessJob } from '@/lib/job-handlers'
import { logger } from '@/lib/logger'

export async function POST() {
  const job = await QueueService.Dequeue()

  if (!job) {
    return NextResponse.json({ success: true, processed: false })
  }

  try {
    const result = await ProcessJob(job.task, job.data)
    return NextResponse.json({ success: true, processed: true, jobId: job.jobId, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown job error'
    logger.error('[Queue] Worker failed', { jobId: job.jobId, task: job.task, error })
    await QueueService.FailJob(job, message)
    return NextResponse.json(
      { success: false, processed: false, jobId: job.jobId, message },
      { status: 500 }
    )
  }
}
