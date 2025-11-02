"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  Building2,
  PiggyBank
} from "lucide-react"
import { EmployeePayrollCard } from "@/components/employee-payroll-card"
import { useUserData } from "@/hooks/use-user-data"
import type { PayrollStreamWithDetails } from "@/lib/types/payroll"
import { formatCurrency } from "@/lib/utils"

interface EmployeeOrganizationViewProps {
  organizationId: string
}

export function EmployeeOrganizationView({ organizationId }: EmployeeOrganizationViewProps) {
  const router = useRouter()
  const [streams, setStreams] = useState<PayrollStreamWithDetails[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [investmentPercentage, setInvestmentPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const { userData, balance, loading: userLoading } = useUserData()
  const userBalance = balance?.availableBalance || balance?.amount || 0

  useEffect(() => {
    fetchPayrollData()
  }, [organizationId])

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/payroll')
      const data = await response.json()
      
      if (data.success) {
        // Filter streams for this specific organization
        const orgStreams = (data.streams || []).filter(
          (stream: PayrollStreamWithDetails) => stream.employee.organization?.id === organizationId
        )
        setStreams(orgStreams)
        setTotalEarned(data.totalEarned || 0)
        setInvestmentPercentage(data.investmentPercentage || 0)
      } else {
        setError(data.error || 'Failed to fetch payroll data')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPayrollData()
    setRefreshing(false)
  }

  const activeStreams = streams.filter(s => s.status === 'active')
  
  // Find the earliest upcoming payment date
  const nextPayment = activeStreams.length > 0 ? 
    activeStreams.reduce((earliest: Date | null, stream) => {
      if (!stream.nextRunAt) return earliest
      
      const streamDate = new Date(stream.nextRunAt)
      
      // Skip invalid dates
      if (isNaN(streamDate.getTime())) return earliest
      
      // Return this date if we don't have an earliest yet, or if this is earlier
      if (!earliest) return streamDate
      
      return streamDate < earliest ? streamDate : earliest
    }, null) : null
  
  // Calculate total payroll for investment slider
  const totalPayroll = activeStreams.reduce((sum, stream) => sum + stream.amountMonthly, 0)
  
  // Mockup total invested (will be real data later)
  const totalInvested = 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Payroll</h2>
          <p className="text-slate-600 mt-1">Track your payments and earnings from this organization</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(userBalance)}</div>
            <p className="text-xs text-slate-600">USDC</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Invested</CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-sky-600">In Kamino</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Next Payment</CardTitle>
            <Clock className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {nextPayment ? nextPayment.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: nextPayment.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              }) : 'N/A'}
            </div>
            <p className="text-xs text-slate-600">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Preference Section */}
      {totalPayroll > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Investment Preferences</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Set up automatic investments from your payroll
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/investments/preferences')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Manage Investments
              </Button>
            </div>
            {investmentPercentage > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Current allocation:</span>
                  <span className="font-bold text-blue-600">{investmentPercentage}% of payroll</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Payroll Streams</h3>
          <Badge variant="secondary">
            {streams.length} total
          </Badge>
        </div>

        {streams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-slate-400 mb-4" />
              <h4 className="text-lg font-medium text-slate-900 mb-2">No Payroll Streams</h4>
              <p className="text-slate-600 text-center">
                You don't have any active payroll streams from this organization yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {streams.map((stream) => (
              <EmployeePayrollCard 
                key={stream.id} 
                stream={stream} 
                investmentPercentage={investmentPercentage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
