import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { financialCalculationQueue, portfolioValuationQueue, reportGenerationQueue } from '@/lib/jobs/queues'
import type { FinancialCalculationJobData, JobType } from '@/lib/jobs/types'
import { z } from 'zod'

const submitJobSchema = z.object({
  type: z.enum(['financial-calculation', 'portfolio-valuation', 'report-generation']),
  data: z.record(z.unknown()),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = submitJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 },
      )
    }

    const { type, data } = validation.data

    // Validate that userId in data matches current user
    if (data.userId && data.userId !== currentUser.userID) {
      return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 })
    }

    // Ensure userId is set
    const jobData = {
      ...data,
      userId: currentUser.userID,
    } as FinancialCalculationJobData

    let queue
    switch (type) {
      case 'financial-calculation':
        queue = financialCalculationQueue
        break
      case 'portfolio-valuation':
        queue = portfolioValuationQueue
        break
      case 'report-generation':
        queue = reportGenerationQueue
        break
      default:
        return NextResponse.json({ error: 'Unknown job type' }, { status: 400 })
    }

    const job = await queue.add(type, jobData, {
      jobId: `${type}-${Date.now()}-${currentUser.userID}`,
    })

    return NextResponse.json(
      {
        jobId: job.id,
        type,
        status: 'queued',
        message: 'Job submitted successfully',
      },
      { status: 202 },
    )
  } catch (error) {
    console.error('Job submission error:', error)
    return NextResponse.json(
      { error: 'An error occurred submitting the job' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const type = searchParams.get('type') as JobType | null

    if (!jobId || !type) {
      return NextResponse.json(
        { error: 'jobId and type query parameters are required' },
        { status: 400 },
      )
    }

    let queue
    switch (type) {
      case 'financial-calculation':
        queue = financialCalculationQueue
        break
      case 'portfolio-valuation':
        queue = portfolioValuationQueue
        break
      case 'report-generation':
        queue = reportGenerationQueue
        break
      default:
        return NextResponse.json({ error: 'Unknown job type' }, { status: 400 })
    }

    const job = await queue.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job belongs to current user
    const jobData = job.data as FinancialCalculationJobData
    if (jobData.userId !== currentUser.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const state = await job.getState()
    const progress = job.progress
    const result = job.returnvalue

    return NextResponse.json({
      jobId: job.id,
      type,
      state,
      progress,
      result,
      data: jobData,
    })
  } catch (error) {
    console.error('Job status check error:', error)
    return NextResponse.json(
      { error: 'An error occurred checking job status' },
      { status: 500 },
    )
  }
}
