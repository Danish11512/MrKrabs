'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FinancialTransactionWithAccount, TransactionListResponse } from '@/types'

export const TransactionsList = (): React.JSX.Element => {
  const [transactions, setTransactions] = useState<FinancialTransactionWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async (nextCursor?: string): Promise<void> => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('limit', '20')
      if (nextCursor) {
        params.set('cursor', nextCursor)
      }

      const response = await fetch(`/api/transactions?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load transactions')
      }

      const data: TransactionListResponse = await response.json()
      
      if (nextCursor) {
        setTransactions((prev) => [...prev, ...data.transactions])
      } else {
        setTransactions(data.transactions)
      }
      
      setHasMore(data.pagination.hasMore)
      setCursor(data.pagination.cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = (): void => {
    if (cursor && hasMore) {
      loadTransactions(cursor)
    }
  }

  const formatAmount = (amount: string, currency: string = 'USD', type: string): string => {
    const num = parseFloat(amount)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Math.abs(num))
    
    // For credit cards: debits are negative (spending), credits are positive (payments)
    // For checking: debits are negative (withdrawals), credits are positive (deposits)
    return num < 0 ? `-${formatted}` : `+${formatted}`
  }

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No transactions found. Add transactions to your accounts to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your recent financial transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((transaction) => {
            const amount = formatAmount(transaction.amount, transaction.currency, transaction.type)
            const isNegative = parseFloat(transaction.amount) < 0

            return (
              <div
                key={transaction.transactionID}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {transaction.merchant || transaction.description || 'Transaction'}
                    </h4>
                    {transaction.status === 'pending' && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {transaction.category && (
                      <span className="text-xs text-muted-foreground">
                        {transaction.category}
                      </span>
                    )}
                    {transaction.account.accountNumber && (
                      <span className="text-xs text-muted-foreground">
                        • {transaction.account.accountNumber}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {formatDate(transaction.transactionDate)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      isNegative ? 'text-destructive' : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {amount}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        {hasMore && (
          <div className="mt-4 text-center">
            <Button onClick={loadMore} variant="outline" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
