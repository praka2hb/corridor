"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  DollarSign, 
  Clock,
  CheckCircle, 
  Pause, 
  StopCircle,
  TrendingUp
} from "lucide-react"
import type { PayrollStreamWithDetails } from "@/lib/types/payroll"

interface EmployeePayrollCardProps {
  stream: PayrollStreamWithDetails
  investmentPercentage?: number
}

export function EmployeePayrollCard({ stream, investmentPercentage = 0 }: EmployeePayrollCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused':
      case 'inactive':
        return <Pause className="h-4 w-4 text-amber-600" />
      case 'stopped':
      case 'cancelled':
        return <StopCircle className="h-4 w-4 text-red-600" />
      case 'awaiting_confirmation':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'paused':
      case 'inactive':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'stopped':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'awaiting_confirmation':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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

  // Use the monthly amount directly without division
  const paymentAmount = stream.amountMonthly
  const recentRuns = stream.runs?.slice(0, 5) || []
  
  // Calculate investment split
  const investmentAmount = (paymentAmount * investmentPercentage) / 100
  const walletAmount = paymentAmount - investmentAmount

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{stream.employee.organization?.name}</CardTitle>
              <CardDescription className="text-sm">
                {getCadenceLabel(stream.cadence)} payroll stream
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status & Creation Date */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status:</span>
            <Badge variant="outline" className={`${getStatusColor(stream.standingOrderDetails?.status || stream.status)} text-xs px-2 py-0.5`}>
              {getStatusIcon(stream.standingOrderDetails?.status || stream.status)}
              {(stream.standingOrderDetails?.status || stream.status).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          </div>
          <span className="text-slate-500">
            Created {new Date(stream.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Main Payment Info */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ${paymentAmount.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {getCadenceLabel(stream.cadence)} • {stream.currency}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-700">Next Payment</div>
            <div className="text-lg font-bold text-slate-900">
              {(() => {
                const gridDate = stream.standingOrderDetails?.next_execution_date;
                const localDate = stream.nextRunAt;
                const nextDate = gridDate ? new Date(gridDate) : (localDate ? new Date(localDate) : null);
                
                return nextDate ? (
                  nextDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                ) : (
                  <span className="text-slate-400">N/A</span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <CheckCircle className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Payments</div>
              <div className="text-sm font-semibold text-slate-900">
                {stream.runs?.length || 0}
              </div>
            </div>
          </div>
          {stream.totalPaid > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <DollarSign className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Earned</div>
                <div className="text-sm font-semibold text-green-600">
                  ${stream.totalPaid.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Investment Split */}
        {investmentPercentage > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-medium text-slate-700">Auto-Investment</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-sky-600">${investmentAmount.toFixed(2)}</div>
                <div className="text-xs text-slate-500">{investmentPercentage}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Payments - Compact */}
        {recentRuns.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">Recent</span>
              {stream.runs && stream.runs.length > 3 && (
                <span className="text-xs text-slate-400">{stream.runs.length - 3} more</span>
              )}
            </div>
            <div className="space-y-1">
              {recentRuns.slice(0, 3).map((run) => (
                <div key={run.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {new Date(run.runAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="font-semibold text-green-600">
                    ${paymentAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

