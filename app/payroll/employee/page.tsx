"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  DollarSign, 
  Calendar, 
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
import { InvestmentPreferenceSlider } from "@/components/investment-preference-slider"
import { useUserData } from "@/hooks/use-user-data"
import type { PayrollStreamWithDetails } from "@/lib/types/payroll"
import { formatCurrency } from "@/lib/utils"

export default function EmployeePayrollPage() {
  const [streams, setStreams] = useState<PayrollStreamWithDetails[]>([])
  const [totalEarnedThisMonth, setTotalEarnedThisMonth] = useState(0)
  const [totalEarnedThisYear, setTotalEarnedThisYear] = useState(0)
  const [investmentPercentage, setInvestmentPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const { userData, balance, loading: userLoading } = useUserData()
  const userBalance = balance?.availableBalance || balance?.amount || 0

  useEffect(() => {
    fetchPayrollData()
  }, [])

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/payroll')
      const data = await response.json()
      
      if (data.success) {
        setStreams(data.streams || [])
        setTotalEarnedThisMonth(data.totalEarnedThisMonth || 0)
        setTotalEarnedThisYear(data.totalEarnedThisYear || 0)
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

  const getCadenceLabel = (cadence: string) => {
    switch (cadence) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'biweekly': return 'Bi-weekly'
      case 'monthly': return 'Monthly'
      default: return cadence
    }
  }

  const activeStreams = streams.filter(s => s.status === 'active')
  const nextPayment = activeStreams.length > 0 ? 
    activeStreams.reduce((earliest, stream) => {
      if (!stream.nextRunAt) return earliest
      if (!earliest) return stream.nextRunAt
      return new Date(stream.nextRunAt) < new Date(earliest) ? stream.nextRunAt : earliest
    }, null as Date | null) : null
  
  // Calculate total monthly payroll for investment slider
  const totalMonthlyPayroll = activeStreams.reduce((sum, stream) => sum + stream.amountMonthly, 0)
  
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
          <h1 className="text-3xl font-bold text-slate-900">My Payroll</h1>
          <p className="text-slate-600 mt-1">Track your payments and earnings</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Personal Balance</CardTitle>
            <Wallet className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(userBalance)}</div>
            <p className="text-xs text-slate-600 flex items-center mt-1">
              <Wallet className="h-3 w-3 mr-1" />
              USDC
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-sky-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              In Kamino
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalEarnedThisMonth)}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Earned
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {nextPayment ? new Date(nextPayment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
            <p className="text-xs text-slate-600 flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Preference Section */}
      {totalMonthlyPayroll > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Investment Preferences</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InvestmentPreferenceSlider 
                monthlyPayroll={totalMonthlyPayroll}
                currentPercentage={investmentPercentage}
                onSave={(newPercentage) => {
                  setInvestmentPercentage(newPercentage)
                  handleRefresh()
                }}
              />
            </div>
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
              <CardHeader>
                <CardTitle className="text-lg">About Kamino Yield</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">
                  Kamino Finance offers secure, automated yield strategies on Solana.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Current APY</span>
                    <span className="font-bold text-sky-600">~5.2%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Risk Level</span>
                    <span className="font-medium text-slate-900">Low</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Asset</span>
                    <span className="font-medium text-slate-900">USDC</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-2 border-t border-sky-200">
                  Your funds remain secure and can be withdrawn at any time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Payroll Streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payroll Streams</h2>
          <Badge variant="secondary">
            {streams.length} total
          </Badge>
        </div>

        {streams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Payroll Streams</h3>
              <p className="text-slate-600 text-center">
                You don't have any active payroll streams yet. Contact your organization admin to get started.
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

      {/* Payment History */}
      {streams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Your latest payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streams.map((stream) => 
                stream.runs?.slice(0, 3).map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{stream.employee.organization?.name}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(run.runAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${(stream.amountMonthly / (stream.cadence === 'weekly' ? 4 : 1)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">USDC</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {streams.every(s => !s.runs?.length) && (
              <div className="text-center py-4 text-slate-500">
                No payments yet
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

