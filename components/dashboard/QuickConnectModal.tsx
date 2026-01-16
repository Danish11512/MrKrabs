'use client'

import { useState, useEffect } from 'react'
import { faker } from '@faker-js/faker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  FinancialProvider,
  ProviderConnectionWithProvider,
  FinancialAccountWithConnection,
  FinancialTransactionWithAccount,
} from '@/types'

type Step = 'idle' | 'selecting' | 'creating' | 'authorizing' | 'fetching' | 'complete' | 'error'

interface QuickConnectModalState {
  isOpen: boolean
  selectedProvider: FinancialProvider | null
  connection: ProviderConnectionWithProvider | null
  accounts: FinancialAccountWithConnection[]
  transactions: FinancialTransactionWithAccount[]
  currentStep: Step
  error: string | null
  providers: FinancialProvider[]
}

export const QuickConnectModal = (): React.JSX.Element => {
  const [state, setState] = useState<QuickConnectModalState>({
    isOpen: false,
    selectedProvider: null,
    connection: null,
    accounts: [],
    transactions: [],
    currentStep: 'idle',
    error: null,
    providers: [],
  })

  useEffect(() => {
    const fetchProviders = async (): Promise<void> => {
      try {
        const response = await fetch('/api/financial/providers')
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }
        const providers: FinancialProvider[] = await response.json()
        setState((prev) => ({ ...prev, providers }))
      } catch (error) {
        console.error('Error fetching providers:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch providers',
        }))
      }
    }

    fetchProviders()
  }, [])

  const handleOpen = (): void => {
    if (state.providers.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'No providers available',
        isOpen: true,
      }))
      return
    }

    const randomProvider = faker.helpers.arrayElement(state.providers)
    setState((prev) => ({
      ...prev,
      isOpen: true,
      selectedProvider: randomProvider,
      currentStep: 'selecting',
      error: null,
    }))

    void handleConnect(randomProvider)
  }

  const handleConnect = async (provider: FinancialProvider): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, currentStep: 'creating' }))

      const response = await fetch('/api/financial/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerID: provider.providerID,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create connection')
      }

      const data = await response.json()
      const connectionId = data.connectionID

      setState((prev) => ({
        ...prev,
        currentStep: 'authorizing',
      }))

      await handleAuthorize(connectionId)
    } catch (error) {
      console.error('Error creating connection:', error)
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        error: error instanceof Error ? error.message : 'Failed to create connection',
      }))
    }
  }

  const handleAuthorize = async (connectionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/financial/connections/${connectionId}/authorize`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to authorize connection')
      }

      const data = await response.json()

      setState((prev) => ({
        ...prev,
        currentStep: 'fetching',
      }))

      await handleFetchData(connectionId)
    } catch (error) {
      console.error('Error authorizing connection:', error)
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        error: error instanceof Error ? error.message : 'Failed to authorize connection',
      }))
    }
  }

  const handleFetchData = async (connectionId: string): Promise<void> => {
    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/financial/accounts?connectionId=${connectionId}`),
        fetch(`/api/financial/transactions?connectionId=${connectionId}`),
      ])

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts')
      }

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const accounts: FinancialAccountWithConnection[] = await accountsResponse.json()
      const transactionsData = await transactionsResponse.json()
      const transactions: FinancialTransactionWithAccount[] = transactionsData.transactions || []

      const connectionResponse = await fetch('/api/financial/connections')
      if (connectionResponse.ok) {
        const connections: ProviderConnectionWithProvider[] = await connectionResponse.json()
        const connection = connections.find((c) => c.connectionID === connectionId) || null

        setState((prev) => ({
          ...prev,
          connection,
          accounts,
          transactions,
          currentStep: 'complete',
        }))
      } else {
        setState((prev) => ({
          ...prev,
          accounts,
          transactions,
          currentStep: 'complete',
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }))
    }
  }

  const handleClose = (): void => {
    setState({
      isOpen: false,
      selectedProvider: null,
      connection: null,
      accounts: [],
      transactions: [],
      currentStep: 'idle',
      error: null,
      providers: state.providers,
    })
  }

  const getStepMessage = (): string => {
    switch (state.currentStep) {
      case 'selecting':
        return 'Selecting provider...'
      case 'creating':
        return 'Creating connection...'
      case 'authorizing':
        return 'Authorizing connection...'
      case 'fetching':
        return 'Fetching account and transaction data...'
      case 'complete':
        return 'Complete!'
      case 'error':
        return 'Error occurred'
      default:
        return 'Ready to connect'
    }
  }

  const getDisplayData = (): Record<string, unknown> => {
    return {
      provider: state.selectedProvider,
      connection: state.connection,
      accounts: state.accounts,
      transactions: state.transactions,
    }
  }

  return (
    <>
      <Button onClick={handleOpen} variant="default">
        Quick Connect
      </Button>

      <Dialog open={state.isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Quick Connect to Financial Provider</DialogTitle>
            <DialogDescription>
              Simulate OAuth flow and view all fetched data in JSON format
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">{getStepMessage()}</p>
              </div>

              {state.currentStep === 'error' && state.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{state.error}</p>
                </div>
              )}

              {state.currentStep === 'complete' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Successfully connected and fetched all data!
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Data (JSON)</p>
              <pre className="p-4 rounded-lg bg-muted/50 border border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] overflow-x-auto text-xs">
                {JSON.stringify(getDisplayData(), null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
