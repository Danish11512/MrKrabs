'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { FinancialAccount } from '@/types'

export const AccountsList = (): React.JSX.Element => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/accounts')

      if (!response.ok) {
        throw new Error('Failed to load accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBalance = (balance: string, currency: string = 'USD'): string => {
    const num = parseFloat(balance)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(num)
  }

  const formatAccountType = (type: string, subtype?: string | null): string => {
    const typeMap: Record<string, string> = {
      credit_card: 'Credit Card',
      checking: 'Checking',
      savings: 'Savings',
      investment: 'Investment',
    }
    const base = typeMap[type] || type
    return subtype ? `${base} (${subtype})` : base
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading accounts...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No accounts yet. Create an account to start tracking your finances.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>Your financial accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.accountID}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-semibold">
                  {account.name}
                </h3>
                {account.accountNumber && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {account.accountNumber}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatAccountType(account.accountType, account.accountSubtype)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatBalance(account.balance, account.currency)}
                </p>
                {account.creditLimit && (
                  <p className="text-sm text-muted-foreground">
                    Limit: {formatBalance(account.creditLimit, account.currency)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
