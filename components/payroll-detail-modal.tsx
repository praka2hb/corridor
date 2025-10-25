"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Wallet, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  ExternalLink,
  Copy,
  Loader2,
  Building2
} from "lucide-react"
import { format } from "date-fns"

interface PayrollDetailModalProps {
  organizationId: string
  streamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface StandingOrderDetails {
  id: string
  status: string
  amount: number
  currency: string
  cadence: string
  startDate: string
  endDate?: string
  nextRunAt?: string
  createdAt: string
  executionHistory: Array<{
    id: string
    executedAt: string
    amount: number
    status: string
    signature?: string
  }>
  totalExecuted: number
  executionCount: number
  // Grid-specific fields
  remainingAmount?: string
  lastExecutionDate?: string
  gridNextExecutionDate?: string
  gridCreatedAt?: string
  gridDetails?: any
}

interface EmployeeDetails {
  name: string
  email: string
  walletAddress: string
}

export function PayrollDetailModal({
  organizationId,
  streamId,
  open,
  onOpenChange,
}: PayrollDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [standingOrder, setStandingOrder] = useState<StandingOrderDetails | null>(null)
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null)

  useEffect(() => {
    if (open && streamId) {
      fetchPayrollDetails()
    }
  }, [open, streamId])

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/organization/${organizationId}/payroll/${streamId}/details`)
      const data = await response.json()

      if (data.success) {
        setStandingOrder(data.standingOrder)
        setEmployee(data.employee)
      } else {
        setError(data.error || 'Failed to fetch payroll details')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payroll details')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const handleSubmitStandingOrder = async () => {
    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`/api/organization/${organizationId}/payroll/${streamId}/submit`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the details
        await fetchPayrollDetails()
      } else {
        const errorMsg = data.error || 'Failed to submit standing order'
        const suggestion = data.suggestion || ''
        setError(`${errorMsg}${suggestion ? ` ${suggestion}` : ''}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit standing order')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'awaiting_confirmation':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
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
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'awaiting_confirmation':
        return 'bg-blue-100 text-blue-700'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-white/95 to-slate-50/95 border-slate-200/50 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-sky-100 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">Payroll Details</div>
              <div className="text-sm font-medium bg-gradient-to-r from-slate-600 to-sky-500 bg-clip-text text-transparent">
                Corridor
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-sm">
            Detailed information about this payroll stream and its execution history.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {standingOrder && employee && !loading && (
          <div className="space-y-4">
            {/* Employee Information */}
            <Card className="bg-gradient-to-r from-white/80 to-slate-50/80 border-slate-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Name</p>
                    <p className="font-medium text-slate-900">{employee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="font-medium text-slate-900">{employee.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 font-mono text-sm">
                        {employee.walletAddress.slice(0, 8)}...{employee.walletAddress.slice(-8)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(employee.walletAddress)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Schedule */}
            <Card className="bg-gradient-to-r from-white/80 to-slate-50/80 border-slate-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-green-600" />
                  </div>
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Amount per Payment</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${standingOrder.amount.toLocaleString()} {standingOrder.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Frequency</p>
                    <Badge variant="outline" className="text-sm">
                      {getCadenceLabel(standingOrder.cadence)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(standingOrder.status)}>
                        {getStatusIcon(standingOrder.status)}
                        {standingOrder.status.charAt(0).toUpperCase() + standingOrder.status.slice(1).replace('_', ' ')}
                      </Badge>
                      {standingOrder.status === 'awaiting_confirmation' && (
                        <Button
                          size="sm"
                          onClick={handleSubmitStandingOrder}
                          disabled={submitting}
                          className="h-7"
                          variant="outline"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Try Activate'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Next Payment</p>
                    <p className="font-medium text-slate-900">
                      {standingOrder.gridNextExecutionDate ? format(new Date(standingOrder.gridNextExecutionDate), 'PPP') : 'Not scheduled'}
                    </p>
                  </div>
                  {standingOrder.lastExecutionDate && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Last Execution</p>
                      <p className="font-medium text-slate-900">
                        {format(new Date(standingOrder.lastExecutionDate), 'PPP')}
                      </p>
                    </div>
                  )}
                  {standingOrder.remainingAmount && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Remaining Amount</p>
                      <p className="font-medium text-slate-900">
                        ${(parseFloat(standingOrder.remainingAmount) / 1000000).toLocaleString()} {standingOrder.currency}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Statistics */}
            <Card className="bg-gradient-to-r from-white/80 to-slate-50/80 border-slate-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-purple-600" />
                  </div>
                  Payment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50/50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">${standingOrder.totalExecuted.toLocaleString()}</p>
                    <p className="text-sm text-slate-600">Total Paid</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50/50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{standingOrder.executionCount}</p>
                    <p className="text-sm text-slate-600">Payments Made</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Execution History */}
            {standingOrder.executionHistory.length > 0 && (
              <Card className="bg-gradient-to-r from-white/80 to-slate-50/80 border-slate-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-amber-600" />
                    </div>
                    Execution History
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Recent payment executions for this payroll stream
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {standingOrder.executionHistory.slice(0, 8).map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              ${execution.amount.toLocaleString()} {standingOrder.currency}
                            </p>
                            <p className="text-sm text-slate-600">
                              {format(new Date(execution.executedAt), 'PPP')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {execution.status}
                          </Badge>
                          {execution.signature && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(execution.signature!)}
                              className="h-6 w-6 p-0 mt-1"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
