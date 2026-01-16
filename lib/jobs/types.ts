export interface JobPayload {
  jobId: string
  userId: string
  type: JobType
  data: Record<string, unknown>
  createdAt: Date
}

export type JobType =
  | 'financial-calculation'
  | 'portfolio-valuation'
  | 'transaction-aggregation'
  | 'report-generation'
  | 'data-export'

export interface FinancialCalculationJobData {
  userId: string
  calculationType: 'portfolio-value' | 'monthly-summary' | 'yearly-report'
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface JobResult {
  jobId: string
  status: 'completed' | 'failed'
  result?: unknown
  error?: string
  completedAt: Date
}
