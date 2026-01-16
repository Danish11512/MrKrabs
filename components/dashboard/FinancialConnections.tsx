'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FinancialProvider, ProviderConnectionWithProvider } from '@/types'

export const FinancialConnections = (): React.JSX.Element => {
  const router = useRouter()
  const [providers, setProviders] = useState<FinancialProvider[]>([])
  const [connections, setConnections] = useState<ProviderConnectionWithProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const [providersRes, connectionsRes] = await Promise.all([
        fetch('/api/financial/providers'),
        fetch('/api/financial/connections'),
      ])

      if (!providersRes.ok || !connectionsRes.ok) {
        throw new Error('Failed to load data')
      }

      const [providersData, connectionsData] = await Promise.all([
        providersRes.json(),
        connectionsRes.json(),
      ])

      setProviders(providersData)
      setConnections(connectionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (providerId: string): Promise<void> => {
    try {
      setConnecting(providerId)
      const response = await fetch('/api/financial/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerID: providerId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create connection')
      }

      const data = await response.json()
      // Redirect to authorization page
      router.push(data.authorizeUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setConnecting(null)
    }
  }

  const getConnectionStatus = (providerId: string): ProviderConnectionWithProvider['status'] | null => {
    const connection = connections.find((c) => c.providerID === providerId)
    return connection?.status || null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Connections</CardTitle>
          <CardDescription>Connect your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading providers...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Connections</CardTitle>
          <CardDescription>Connect your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button onClick={loadData} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Connections</CardTitle>
        <CardDescription>Connect your financial accounts to view transactions and balances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const status = getConnectionStatus(provider.providerID)
            const isConnecting = connecting === provider.providerID

            return (
              <Card key={provider.providerID} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <CardDescription>
                    {provider.supportedAccountTypes.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {status === 'connected' && (
                    <div className="mb-4">
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ Connected
                      </span>
                    </div>
                  )}
                  {status === 'authorizing' && (
                    <div className="mb-4">
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        Authorizing...
                      </span>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="mb-4">
                      <span className="text-sm text-destructive font-medium">
                        Connection Error
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={() => handleConnect(provider.providerID)}
                    disabled={isConnecting || status === 'connected' || status === 'authorizing'}
                    variant={status === 'connected' ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {isConnecting
                      ? 'Connecting...'
                      : status === 'connected'
                        ? 'Connected'
                        : status === 'authorizing'
                          ? 'Authorizing...'
                          : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
