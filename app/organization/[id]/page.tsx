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

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [transfers, setTransfers] = useState<any[]>([])
  const [signers, setSigners] = useState<any[]>([])
  const [error, setError] = useState("")
  const [refreshingBalance, setRefreshingBalance] = useState(false)
  const [addSignerDialogOpen, setAddSignerDialogOpen] = useState(false)
  const [manageSignersOpen, setManageSignersOpen] = useState(false)

  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
      fetchBalance()
      fetchTransfers()
      fetchSigners()
    }
  }, [organizationId])

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
    // Refresh transfers and scroll to transfers section
    fetchTransfers()
    // Scroll to transfers section if it exists
    const transfersSection = document.getElementById('transfers-section')
    if (transfersSection) {
      transfersSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const fetchTransfers = async () => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/transfers?limit=5`)
      const data = await response.json()
      
      if (data.success) {
        setTransfers(data.transfers)
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err)
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

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })} ${currency}`
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
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gradient-to-br from-sky-100 to-blue-100 p-3 border-2 border-sky-200">
                  <Building2 className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage your organization settings, members, and resources
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {organization.role}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Created {new Date(organization.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Treasury Balance Cards */}
            {balance && (
              <div className="flex flex-wrap gap-4">
                {/* USDC Balance Card */}
                <Card className="flex-1 min-w-[280px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        USDC Balance
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={handleRefreshBalance}
                        disabled={refreshingBalance}
                      >
                        <RefreshCw className={`h-3 w-3 ${refreshingBalance ? 'animate-spin' : ''}`} />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        ${balance.USDC.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Treasury balance</p>
                    </div>
                    {transfers.length > 0 ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleGetTransfers}
                      >
                        <TrendingUp className="h-3 w-3 mr-2" />
                        View Transfers
                      </Button>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No transactions yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Virtual Account Card */}
                <Card className="flex-1 min-w-[280px] bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      Virtual Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VirtualAccountCard organizationId={organizationId} compact />
                  </CardContent>
                </Card>

                {/* Signers Card */}
                <Card className="flex-1 min-w-[280px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-sky-600" />
                        Signers
                      </span>
                      {(organization.role === 'owner' || organization.role === 'admin') && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setManageSignersOpen(true)}
                        >
                          <UserCog className="h-3 w-3" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {signers.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold text-slate-900">{signers.length}</div>
                          <p className="text-xs text-slate-500 mb-2">Active signers</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {signers.map((signer) => (
                              <div key={signer.id} className="flex items-center gap-2 text-xs">
                                <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center">
                                  <span className="text-[10px] font-medium text-sky-700">
                                    {signer.user.email?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-slate-600 truncate flex-1">{signer.user.email}</span>
                                {signer.role === 'owner' && (
                                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                                    Owner
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No signers added yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Transfers */}
            {transfers.length > 0 && (
              <Card id="transfers-section">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Transfers</CardTitle>
                      <CardDescription className="text-sm">
                        Latest treasury transactions
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transfers.map((transfer) => (
                      <div 
                        key={transfer.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transfer.type === 'incoming' 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}>
                            {transfer.type === 'incoming' ? (
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {transfer.type === 'incoming' ? 'Received' : 'Sent'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transfer.type === 'incoming' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transfer.type === 'incoming' ? '+' : '-'}
                            {formatCurrency(transfer.amount, transfer.currency)}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {transfer.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employee Payroll Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Employee Payroll</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage employee profiles and payroll information
                  </p>
                </div>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-slate-500">
                    <p className="text-sm">No employees added yet</p>
                    <p className="text-xs mt-1">Add employees to manage payroll</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
