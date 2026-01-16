'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthorizePage(): React.JSX.Element {
  const router = useRouter()
  const params = useParams()
  const connectionId = params.connectionId as string
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuthorize = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/financial/connections/${connectionId}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to authorize connection')
      }

      const data = await response.json()
      
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authorize connection')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorize Financial Connection</CardTitle>
          <CardDescription>
            Complete the authorization to connect your financial account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              By authorizing this connection, you agree to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Share your account information with this application</li>
              <li>Allow access to transaction history</li>
              <li>Enable balance synchronization</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAuthorize}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Authorizing...' : 'Authorize'}
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
