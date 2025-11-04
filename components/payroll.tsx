"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { 
  Bell,
  Plus,
  Send,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Download,
  FileText,
  Wallet,
  Copy,
  Users,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddEmployeePayrollDialog } from "@/components/add-employee-payroll-dialog"
import { PayrollDetailModal } from "@/components/payroll-detail-modal"
import type { PayrollStreamWithDetails } from "@/lib/types/payroll"

interface PayrollProps {
  organizationId?: string
}

export function Payroll({ organizationId: propOrganizationId }: PayrollProps) {
  const params = useParams()
  const organizationId = propOrganizationId || params.id as string
  
  const [streams, setStreams] = useState<PayrollStreamWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null)

  useEffect(() => {
    if (organizationId) {
      fetchPayrollStreams()
    }
  }, [organizationId])

  // Auto-refresh every 30 seconds to keep data up-to-date
  useEffect(() => {
    if (!organizationId) return

    const intervalId = setInterval(() => {
      fetchPayrollStreams(true) // Silent refresh to avoid UI flickering
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [organizationId])

  const fetchPayrollStreams = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const response = await fetch(`/api/organization/${organizationId}/payroll`)
      const data = await response.json()
      
      if (data.success) {
        setStreams(data.streams || [])
      } else {
        setError(data.error || 'Failed to fetch payroll streams')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payroll streams')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPayrollStreams()
    setRefreshing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const handleRowClick = (streamId: string) => {
    setSelectedStreamId(streamId)
    setDetailModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
      case 'paused':
        return <Clock className="h-3 w-3 mr-1 text-amber-600" />
      case 'stopped':
        return <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
      default:
        return <AlertCircle className="h-3 w-3 mr-1 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'paused':
        return 'bg-amber-100 text-amber-700'
      case 'stopped':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCadenceLabel = (cadence: string) => {
    switch (cadence) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'biweekly': return 'Bi-weekly'
      case 'monthly': return 'Monthly'
      default: return cadence
    }
  }

  const totalMonthlyCost = streams.reduce((total, stream) => {
    return total + stream.amountMonthly
  }, 0)

  const activeStreams = streams.filter(s => s.status === 'active').length

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Payroll Management</h2>
          <p className="text-slate-600 mt-1">Manage your team's streaming payments and USDC payroll.</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Payroll Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Payroll Management</h2>
        <p className="text-slate-600 mt-1">Manage your team's streaming payments and USDC payroll.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payroll Overview Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Payroll Overview</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50/80 rounded-xl p-6">
            <div className="text-3xl font-bold text-slate-900 mb-2">${totalMonthlyCost.toLocaleString()}</div>
            <div className="text-sm text-slate-600 mb-4">Total monthly payroll cost</div>
            <div className="text-xs text-green-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Automated payments active
            </div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{streams.length}</div>
            <div className="text-sm text-slate-600 mb-4">Total employees on payroll</div>
            <div className="text-xs text-blue-600 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {activeStreams} currently active
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            variant="neo" 
            size="lg" 
            className="px-8"
            onClick={() => setAddEmployeeOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Employees</h3>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {streams.length} total
          </Badge>
        </div>
        
        {streams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No employees added yet</p>
            <p className="text-sm text-slate-500">Add employees to start managing payroll</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream) => (
                  <TableRow 
                    key={stream.id} 
                    className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => handleRowClick(stream.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {stream.employee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{stream.employee.name}</span>
                          {stream.employee.email && (
                            <p className="text-xs text-slate-500">{stream.employee.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">${stream.amountMonthly.toLocaleString()}</span>
                      <span className="text-sm text-slate-600 ml-1">USDC</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCadenceLabel(stream.cadence)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(stream.gridStatus || stream.status)}
                      >
                        {getStatusIcon(stream.gridStatus || stream.status)}
                        {(stream.gridStatus || stream.status).charAt(0).toUpperCase() + (stream.gridStatus || stream.status).slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stream.gridNextExecutionDate ? (
                        <span className="text-sm">
                          {new Date(stream.gridNextExecutionDate).toLocaleDateString()}
                        </span>
                      ) : stream.nextRunAt ? (
                        <span className="text-sm">
                          {new Date(stream.nextRunAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {new Date(stream.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Automatic Payroll Information */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-sky-50/80 rounded-xl border border-blue-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Automatic Payroll</h4>
          </div>
          <p className="text-sm text-slate-600">
            Payroll streams run automatically according to their configured schedule. Once created, payments are processed 
            without manual intervention and cannot be paused or stopped. This ensures consistent and reliable payroll delivery.
          </p>
        </div>
      </div>

      {/* Reports & Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transfers Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Recent Transfers</h3>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="space-y-3">
            {/* Mock recent transfers - replace with real data */}
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Payroll Payment</p>
                  <p className="text-sm text-slate-600">Employee salary</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+$2,500.00</p>
                <p className="text-xs text-slate-500">USDC</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Treasury Deposit</p>
                  <p className="text-sm text-slate-600">Organization funding</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">+$10,000.00</p>
                <p className="text-xs text-slate-500">USDC</p>
              </div>
            </div>
            
            <div className="text-center py-2">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All Transfers
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics & Reports Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Analytics & Reports</h3>
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/80 rounded-xl">
              <h4 className="font-semibold text-slate-900 mb-2">Payroll Summary</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Monthly Cost</span>
                  <span className="font-semibold">${totalMonthlyCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Active Employees</span>
                  <span className="font-semibold">{activeStreams}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Average Salary</span>
                  <span className="font-semibold">
                    ${streams.length > 0 ? Math.round(totalMonthlyCost / streams.length).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="neoOutline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="neoOutline" size="sm" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Tax Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <AddEmployeePayrollDialog
        organizationId={organizationId}
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        onSuccess={fetchPayrollStreams}
      />

      {/* Payroll Detail Modal */}
      {selectedStreamId && (
        <PayrollDetailModal
          organizationId={organizationId}
          streamId={selectedStreamId}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />
      )}
    </div>
  )
}
