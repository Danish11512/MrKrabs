export interface BalanceSnapshot {
  snapshotID: string
  accountID: string
  balance: string // Decimal as string for precision
  currency: string
  snapshotDate: Date
  created: Date
}
