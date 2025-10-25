"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react"

export default function EmployeeStatusDebugPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch('/api/debug/employee-check')
      const result = await response.json()
      
      if (result.success) {
        setData(result.debug)
      } else {
        setError(result.error || 'Failed to fetch status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Status Debug</h1>
          <p className="text-slate-600 mt-1">Check your employee profile linking status</p>
        </div>
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Your current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Has Employee Profiles:</span>
                {data.summary.hasEmployeeProfiles ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Has Unmatched Profiles:</span>
                {data.summary.hasUnmatchedProfiles ? (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Yes - Run Migration!
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Has Organization Memberships:</span>
                {data.summary.hasMemberships ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">User ID:</span>
                <span className="text-sm font-mono">{data.user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Email:</span>
                <span className="text-sm font-medium">{data.user.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked Employee Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Employee Profiles ({data.employeeProfiles.length})</CardTitle>
              <CardDescription>Employee profiles connected to your user account</CardDescription>
            </CardHeader>
            <CardContent>
              {data.employeeProfiles.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No linked employee profiles</p>
              ) : (
                <div className="space-y-3">
                  {data.employeeProfiles.map((profile: any) => (
                    <div key={profile.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-green-900">{profile.name}</p>
                          <p className="text-sm text-green-700">{profile.email}</p>
                          <p className="text-sm text-green-600 mt-1">
                            Organization: {profile.organization}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Linked
                        </Badge>
                      </div>
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <a 
                          href={`/organization/${profile.organizationId}`}
                          className="text-sm text-green-700 hover:text-green-900 underline"
                        >
                          → View Organization Dashboard
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unmatched Profiles */}
          {data.unmatchedProfiles.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">
                  Unmatched Employee Profiles ({data.unmatchedProfiles.length})
                </CardTitle>
                <CardDescription className="text-red-700">
                  These profiles have your email but are not linked to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action Required:</strong> Run the migration script to link these profiles:
                    <code className="block mt-2 p-2 bg-red-100 rounded text-sm">
                      npx tsx scripts/link-employee-users.ts
                    </code>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  {data.unmatchedProfiles.map((profile: any) => (
                    <div key={profile.id} className="p-3 bg-white border border-red-300 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-900">{profile.name}</p>
                          <p className="text-sm text-red-700">{profile.email}</p>
                          <p className="text-sm text-red-600 mt-1">
                            Organization: {profile.organization}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Linked
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Memberships */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Memberships ({data.memberships.length})</CardTitle>
              <CardDescription>Organizations where you are an admin/owner/member</CardDescription>
            </CardHeader>
            <CardContent>
              {data.memberships.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No organization memberships</p>
              ) : (
                <div className="space-y-3">
                  {data.memberships.map((membership: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-blue-900">{membership.organization}</p>
                          <p className="text-sm text-blue-700">Role: {membership.role}</p>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {membership.role}
                        </Badge>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <a 
                          href={`/organization/${membership.organizationId}`}
                          className="text-sm text-blue-700 hover:text-blue-900 underline"
                        >
                          → View Organization Dashboard
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
