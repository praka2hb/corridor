"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Building2, Loader2, AlertCircle, Users, Settings, TrendingUp, Wallet, RefreshCw, UserPlus, DollarSign, ArrowUpRight, ArrowDownRight, UserCog } from "lucide-react"
import { VirtualAccountCard } from "@/components/virtual-account-card"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { ManageSignersDialog } from "@/components/manage-signers-dialog"
import { Payroll } from "@/components/payroll"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeeOrganizationView } from "@/components/employee-organization-view"

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [transfers, setTransfers] = useState<any[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [signers, setSigners] = useState<any[]>([])
  const [error, setError] = useState("")
  const [refreshingBalance, setRefreshingBalance] = useState(false)
  const [addSignerDialogOpen, setAddSignerDialogOpen] = useState(false)
  const [manageSignersOpen, setManageSignersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("business")

  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
      
      // Only fetch admin data if needed (will be called by renderBusinessView if user has access)
      // For employee-only users, these calls might fail but shouldn't block the page
      fetchBalance().catch(err => console.log('[OrgPage] Balance fetch failed (may be employee-only):', err))
      fetchTransfers().catch(err => console.log('[OrgPage] Transfers fetch failed (may be employee-only):', err))
      fetchSigners().catch(err => console.log('[OrgPage] Signers fetch failed (may be employee-only):', err))
      
      // Load saved tab preference from localStorage
      const savedTab = localStorage.getItem(`org-${organizationId}-tab`)
      if (savedTab) {
        setActiveTab(savedTab)
      }
    }
  }, [organizationId])

  // Save tab preference to localStorage
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(`org-${organizationId}-tab`, value)
  }

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organization/${organizationId}`)
      const data = await response.json()
      
      if (data.success && data.organization) {
        setOrganization(data.organization)
      } else {
        setError(data.error || 'Organization not found')
      }
    } catch (err: any) {
      console.error('Failed to fetch organization:', err)
      setError(err.message || 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/balance`)
      const data = await response.json()
      
      if (data.success) {
        setBalance(data.balances)
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }

  const handleGetTransfers = () => {
    // Navigate to transfers page
    router.push(`/transfers?organization=${organizationId}&type=payroll`)
  }

  const fetchTransfers = async () => {
    try {
      console.log('[OrgPage] Starting fetchTransfers...')
      setLoadingTransfers(true)
      
      const response = await fetch(`/api/organization/${organizationId}/transfers?limit=5&type=payroll`)
      const data = await response.json()
      
      console.log('[OrgPage] Transfers API response:', data)
      
      if (data.success) {
        setTransfers(data.transfers || [])
        console.log('[OrgPage] Set transfers:', (data.transfers || []).length, 'transfers')
      } else {
        console.error('[OrgPage] Transfers API returned error:', data.error)
        setTransfers([])
      }
    } catch (err) {
      console.error('[OrgPage] Failed to fetch transfers:', err)
      setTransfers([])
    } finally {
      setLoadingTransfers(false)
    }
  }

  const fetchSigners = async () => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/members`)
      const data = await response.json()
      
      if (data.success) {
        setSigners(data.members)
      }
    } catch (err) {
      console.error('Failed to fetch signers:', err)
    }
  }

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true)
    await fetchBalance()
    setRefreshingBalance(false)
  }

  const formatCurrency = (amount: number | undefined, currency: string) => {
    const value = amount || 0;
    return `${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })} ${currency}`
  }

  // Business/Admin view rendering function
  const renderBusinessView = () => {
    return (
      <>
        {/* Treasury Balance Cards with Corridor Styling */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* USDC Balance Card */}
            <Card className="bg-gradient-to-br from-white/90 to-slate-50/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-sky-600" />
                    </div>
                    USDC Balance
                  </span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 hover:bg-slate-100"
                    onClick={handleRefreshBalance}
                    disabled={refreshingBalance}
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-slate-900">
                    ${(balance.USDC || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">Treasury balance</p>
                </div>
                
                {/* Recent Payroll Transfers */}
                {loadingTransfers ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-700">Recent Payroll Transfers</p>
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                      <span className="ml-2 text-sm text-slate-500">Loading transfers...</span>
                    </div>
                  </div>
                ) : transfers.filter(t => (t.amount || 0) > 0).length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-slate-700">Recent Payroll Transfers</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {transfers.filter(t => (t.amount || 0) > 0).slice(0, 3).map((transfer: any) => (
                        <div key={transfer.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${
                              transfer.type === 'incoming' 
                                ? 'bg-green-100' 
                                : 'bg-red-100'
                            }`}>
                              {transfer.type === 'incoming' ? (
                                <ArrowDownRight className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {transfer.employeeName || (transfer.type === 'incoming' ? 'Received' : 'Sent')}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(transfer.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              transfer.type === 'incoming' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transfer.type === 'incoming' ? '+' : '-'}
                              ${(transfer.amount || 0).toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {transfers.filter(t => (t.amount || 0) > 0).length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs h-6 mt-2"
                        onClick={handleGetTransfers}
                      >
                        View All ({transfers.filter(t => (t.amount || 0) > 0).length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-slate-500 italic">No payroll transfers yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Virtual Account Card */}
            <Card className="bg-gradient-to-br from-white/90 to-slate-50/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  Virtual Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VirtualAccountCard organizationId={organizationId} compact />
              </CardContent>
            </Card>

            {/* Signers Card */}
            <Card className="bg-gradient-to-br from-white/90 to-slate-50/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    Members
                  </span>
                  {(organization.role === 'owner' || organization.role === 'admin') && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="hover:bg-slate-100"
                      onClick={() => setManageSignersOpen(true)}
                    >
                      <UserCog className="h-3 w-3" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signers.length > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-slate-900">{signers.length}</div>
                      <p className="text-sm text-slate-600 mb-3">Active signers</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {signers.slice(0, 3).map((signer: any) => (
                          <div key={signer.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-slate-50/50">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-sky-700">
                                {signer.user.email?.[0]?.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-slate-700 truncate flex-1">{signer.user.email}</span>
                            {signer.role === 'owner' && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                Owner
                              </span>
                            )}
                          </div>
                        ))}
                        {signers.length > 3 && (
                          <p className="text-xs text-slate-500 text-center">
                            +{signers.length - 3} more
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No signers added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payroll Management */}
        <Payroll organizationId={organizationId} />
      </>
    )
  }

  return (
    <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                <p className="text-sm text-slate-600">Loading organization...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Organization Content */}
        {organization && !loading && (
          <>
            {/* Header with Corridor Branding */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-sky-100 p-4 border border-slate-200/50 shadow-sm">
                  <Building2 className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-slate-900">{organization.name}</h1>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <span className="text-sm font-medium bg-gradient-to-r from-slate-600 to-sky-500 bg-clip-text text-transparent">
                      Corridor
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Manage your organization settings, members, and resources
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    {organization.role && (
                      <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
                        {organization.role}
                      </Badge>
                    )}
                    {organization.isEmployee && (
                      <Badge variant="outline" className="text-xs bg-sky-50 border-sky-200 text-sky-700">
                        Employee
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500">
                      Created {new Date(organization.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Tabbed Interface for Dual-Role Users */}
            {organization.role && organization.isEmployee ? (
              // Dual-role: Show tabs
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="payroll">My Payroll</TabsTrigger>
                </TabsList>
                
                <TabsContent value="business" className="space-y-4">
                  {renderBusinessView()}
                </TabsContent>
                
                <TabsContent value="payroll" className="space-y-4">
                  <EmployeeOrganizationView organizationId={organizationId} />
                </TabsContent>
              </Tabs>
            ) : organization.isEmployee ? (
              // Employee-only view (no tabs)
              <EmployeeOrganizationView organizationId={organizationId} />
            ) : (
              // Member-only view (no tabs)
              renderBusinessView()
            )}
          </>
        )}

        {/* Manage Signers Dialog */}
        <ManageSignersDialog
          organizationId={organizationId}
          open={manageSignersOpen}
          onOpenChange={setManageSignersOpen}
          onUpdate={fetchSigners}
          currentUserRole={organization?.role || 'member'}
        />

        {/* Hidden trigger for add signer dialog */}
        <button
          data-add-signer-trigger
          style={{ display: 'none' }}
          onClick={() => setAddSignerDialogOpen(true)}
        />

        {/* Add Signer Dialog */}
        <InviteMemberDialog
          organizationId={organizationId}
          open={addSignerDialogOpen}
          onOpenChange={setAddSignerDialogOpen}
          onSuccess={fetchSigners}
        />
      </div>
    )
  }
