"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Building2, Loader2, AlertCircle, ArrowLeft, Shield, CheckCircle, User, RefreshCw, XCircle, Clock, FileWarning } from "lucide-react"

interface RejectionReason {
  developer_reason: string
  reason: string
  created_at: string
}

interface KycCheckResponse {
  success: boolean
  state: string
  canCreateOrg: boolean
  message: string
  kycStatus?: string
  kycType?: string
  continuationLink?: string
  rejectionReasons?: RejectionReason[]
  verificationLevel?: string
  error?: string
}

export default function NewOrganizationPage() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [error, setError] = useState("")
  const [checkingKyc, setCheckingKyc] = useState(true)
  const [kycCheck, setKycCheck] = useState<KycCheckResponse | null>(null)
  const [showAllRejections, setShowAllRejections] = useState(false)
  const [requestingKyc, setRequestingKyc] = useState(false)

  useEffect(() => {
    checkKycStatus()
  }, [])

  const checkKycStatus = async () => {
    setCheckingKyc(true)
    setError("")

    try {
      const response = await fetch('/api/kyc/check-before-org')
      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to check KYC status')
        return
      }

      console.log('[NewOrg] KYC Check Result:', data)
      setKycCheck(data)

    } catch (err: any) {
      console.error('[NewOrg] Error checking KYC:', err)
      setError('Failed to check verification status. Please try again.')
    } finally {
      setCheckingKyc(false)
    }
  }

  const handleRequestKyc = async () => {
    setRequestingKyc(true)
    setError("")

    try {
      const response = await fetch('/api/kyc/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'individual' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to request KYC link')
      }

      // Redirect to KYC verification
      if (data.kycData?.kyc_link) {
        console.log('[NewOrg] Redirecting to KYC:', data.kycData.kyc_link)
        window.location.href = data.kycData.kyc_link
      }

    } catch (err: any) {
      setError(err.message || 'Failed to start verification. Please try again.')
      setRequestingKyc(false)
    }
  }

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) {
      setError("Please enter an organization name")
      return
    }

    setError("")
    setCreatingOrg(true)

    try {
      const response = await fetch('/api/organization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: organizationName.trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create organization')
      }

      // Redirect to organization page
      if (data.organization?.id) {
        router.push(`/organization/${data.organization.id}`)
      } else {
        router.push('/organization')
      }

    } catch (err: any) {
      setError(err.message || 'Failed to create organization. Please try again.')
      setCreatingOrg(false)
    }
  }

  // Loading state
  if (checkingKyc) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 text-lg">Checking verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !kycCheck) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle>Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/organization')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={checkKycStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mostRecentRejection = kycCheck?.rejectionReasons?.[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/organization')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Create Organization</h1>
          <p className="text-slate-600 mt-2">
            Set up your organization to manage treasury and team payments
          </p>
        </div>

        {/* KYC Status Cards */}
        {kycCheck?.state === 'no-kyc' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-blue-900">Verification Required</CardTitle>
                  <CardDescription className="text-blue-700">
                    Complete identity verification to create organizations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-2">
                  <p className="text-sm text-slate-700 font-medium">What you'll need:</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                    <li>Government-issued ID (passport, driver's license, or national ID)</li>
                    <li>Clear photos in good lighting</li>
                    <li>5-10 minutes to complete the process</li>
                  </ul>
                </div>
                <Button
                  onClick={handleRequestKyc}
                  disabled={requestingKyc}
                  className="w-full"
                  size="lg"
                >
                  {requestingKyc ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Verification...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Start Verification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {kycCheck?.state === 'incomplete' && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <FileWarning className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-amber-900">Verification Incomplete</CardTitle>
                  <CardDescription className="text-amber-700">
                    You started verification but didn't finish
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostRecentRejection && (
                  <Alert className="bg-white border-amber-200">
                    <AlertDescription>
                      <p className="font-medium text-amber-900 mb-1">Previous attempt issue:</p>
                      <p className="text-sm text-amber-800">{mostRecentRejection.reason}</p>
                      {showAllRejections && kycCheck.rejectionReasons && kycCheck.rejectionReasons.length > 1 && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-amber-200">
                          {kycCheck.rejectionReasons.slice(1).map((rejection, idx) => (
                            <div key={idx} className="text-xs text-amber-700">
                              <p className="font-medium">{new Date(rejection.created_at).toLocaleDateString()}</p>
                              <p>{rejection.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {kycCheck.rejectionReasons && kycCheck.rejectionReasons.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllRejections(!showAllRejections)}
                    className="text-amber-700 hover:text-amber-800"
                  >
                    {showAllRejections ? 'Hide' : 'View all'} {kycCheck.rejectionReasons.length} attempts
                  </Button>
                )}
                {kycCheck.continuationLink && (
                  <Button
                    onClick={() => window.location.href = kycCheck.continuationLink!}
                    className="w-full"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Continue Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {kycCheck?.state === 'rejected' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-red-900">Verification Rejected</CardTitle>
                  <CardDescription className="text-red-700">
                    Your verification was not approved
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostRecentRejection && (
                  <Alert className="bg-white border-red-200">
                    <AlertDescription>
                      <p className="font-medium text-red-900 mb-1">Reason:</p>
                      <p className="text-sm text-red-800 mb-2">{mostRecentRejection.reason}</p>
                      <p className="text-xs text-red-600">
                        {new Date(mostRecentRejection.created_at).toLocaleString()}
                      </p>
                      {showAllRejections && kycCheck.rejectionReasons && kycCheck.rejectionReasons.length > 1 && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-red-200">
                          <p className="text-xs font-medium text-red-900">Previous attempts:</p>
                          {kycCheck.rejectionReasons.slice(1).map((rejection, idx) => (
                            <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                              <p className="font-medium">{new Date(rejection.created_at).toLocaleDateString()}</p>
                              <p>{rejection.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {kycCheck.rejectionReasons && kycCheck.rejectionReasons.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllRejections(!showAllRejections)}
                    className="text-red-700 hover:text-red-800"
                  >
                    {showAllRejections ? 'Hide' : 'View'} all {kycCheck.rejectionReasons.length} attempts
                  </Button>
                )}
                {kycCheck.continuationLink && (
                  <Button
                    onClick={() => window.location.href = kycCheck.continuationLink!}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {kycCheck?.state === 'pending' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-blue-900">Verification In Progress</CardTitle>
                  <CardDescription className="text-blue-700">
                    Your verification is being reviewed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-blue-800">
                  We're reviewing your verification. This usually takes a few minutes. 
                  You'll be able to create organizations once approved.
                </p>
                <Button
                  onClick={checkKycStatus}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Creation Form - Only show if approved */}
        {kycCheck?.canCreateOrg && (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Create Your Organization</CardTitle>
                  <CardDescription>
                    Your verification is approved. You can now create an organization.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="Enter organization name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    disabled={creatingOrg}
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-slate-900">What happens next:</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                    <li>A secure multisig treasury will be created</li>
                    <li>You'll be set as the organization owner</li>
                    <li>You can add team members and manage payments</li>
                  </ul>
                </div>

                <Button
                  onClick={handleCreateOrganization}
                  disabled={creatingOrg || !organizationName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {creatingOrg ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Create Organization
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blocked state - Can't create org */}
        {!kycCheck?.canCreateOrg && kycCheck?.state !== 'no-kyc' && kycCheck?.state !== 'incomplete' && kycCheck?.state !== 'rejected' && kycCheck?.state !== 'pending' && (
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">
                  Organization creation is not available at this time.
                </p>
                <Button
                  variant="outline"
                  onClick={checkKycStatus}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
