import { Worker } from 'bullmq'
import { getRedisClient } from './redis'
import { financialCalculationQueue, portfolioValuationQueue, reportGenerationQueue } from './queues'
import { processFinancialCalculation } from './processors/financial-calculations'
import type { FinancialCalculationJobData } from './types'

// Financial Calculations Worker
export const financialCalculationWorker = new Worker<FinancialCalculationJobData>(
  'financial-calculations',
  async (job: Parameters<Parameters<typeof Worker.prototype.process>[0]>[0]) => {
    return await processFinancialCalculation(job)
  },
  {
    connection: getRedisClient(),
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  },
)

financialCalculationWorker.on('completed', (job): void => {
  console.log(`Financial calculation job ${job.id} completed`)
})

financialCalculationWorker.on('failed', (job, err): void => {
  console.error(`Financial calculation job ${job?.id} failed:`, err)
})

// Portfolio Valuation Worker
export const portfolioValuationWorker = new Worker(
  'portfolio-valuations',
  async (job) => {
    // Future: Implement portfolio valuation logic
    console.log(`Processing portfolio valuation job ${job.id}`)
    return { success: true }
  },
  {
    connection: getRedisClient(),
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  },
)

// Report Generation Worker
export const reportGenerationWorker = new Worker(
  'report-generation',
  async (job) => {
    // Future: Implement report generation logic
    console.log(`Processing report generation job ${job.id}`)
    return { success: true }
  },
  {
    connection: getRedisClient(),
    concurrency: 2,
    limiter: {
      max: 3,
      duration: 1000,
    },
  },
)

// Graceful shutdown
export const closeWorkers = async (): Promise<void> => {
  await Promise.all([
    financialCalculationWorker.close(),
    portfolioValuationWorker.close(),
    reportGenerationWorker.close(),
  ])
}
