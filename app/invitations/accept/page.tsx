"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Mail, Building2 } from "lucide-react"

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkAuth()
    if (token) {
      verifyInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // If user is logged in and we have a valid invitation, accept it automatically
    if (isAuthenticated && invitation && !accepting && !success && !error) {
      acceptInvitation()
    }
  }, [isAuthenticated, invitation])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user')
      const data = await response.json()
      setIsAuthenticated(data.success && data.user)
    } catch (err) {
      setIsAuthenticated(false)
    }
  }

  const verifyInvitation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/accept?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation')
      }

      setInvitation(data.invitation)
    } catch (err: any) {
      setError(err.message || 'Failed to verify invitation')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    try {
      setAccepting(true)
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)

      // Redirect to organization after 2 seconds
      setTimeout(() => {
        router.push(`/organization/${data.organization.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleSignIn = () => {
    // Store the invitation token to redirect back after login
    localStorage.setItem('invitationToken', token || '')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/organization')}>
              Go to Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Welcome! 🎉</CardTitle>
            <CardDescription className="text-center">
              You've successfully joined {invitation.organization.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting to organization...
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show invitation details and prompt to login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-center">Organization Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join {invitation.organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Organization</span>
              <span className="font-medium">{invitation.organization.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            {invitation.position && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium">{invitation.position}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
          </div>

          {/* Authentication Required */}
          {!isAuthenticated && (
            <>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Please sign in with the email address <strong>{invitation.email}</strong> to accept this invitation.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSignIn} 
                className="w-full"
              >
                Sign In to Accept
              </Button>
            </>
          )}

          {/* Accepting */}
          {isAuthenticated && accepting && (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
              <p className="text-sm text-muted-foreground">Accepting invitation...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
