import { Queue } from 'bullmq'
import { getRedisClient } from './redis'

export const financialCalculationQueue = new Queue('financial-calculations', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
})

export const portfolioValuationQueue = new Queue('portfolio-valuations', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 100,
    },
    removeOnFail: {
      age: 86400,
    },
  },
})

export const reportGenerationQueue = new Queue('report-generation', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      age: 7200, // Keep completed reports for 2 hours
      count: 50,
    },
    removeOnFail: {
      age: 86400,
    },
  },
})
