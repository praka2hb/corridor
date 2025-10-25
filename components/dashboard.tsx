"use client"

import { useRouter } from "next/navigation"
import { 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  Building2,
  ArrowRight,
  Wallet,
  Calendar,
  Mail,
  ExternalLink,
  Activity,
  Shield,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserData } from "@/hooks/use-user-data"
import { useOrganizations } from "@/hooks/use-organizations"
import { useEmployeePayroll } from "@/hooks/use-employee-payroll"
import { useInvestmentData } from "@/hooks/use-investment-data"
import { useBusinessMetrics } from "@/hooks/use-business-metrics"
import { InvestmentTrendChart } from "@/components/ui/investment-trend-chart"
import { formatCurrency, formatPercentage } from "@/lib/utils"


export function Dashboard() {
  const { userData, balance, loading: userLoading } = useUserData()
  const { organizations, loading: orgsLoading } = useOrganizations()
  const { payrollStreams, loading: payrollLoading } = useEmployeePayroll()
  const { personalHoldings, growthHistory, availableStrategies, loading: investmentLoading } = useInvestmentData()
  const { managedOrganizations, loading: metricsLoading } = useBusinessMetrics()
  const router = useRouter()

  // Get username or fallback to email or "there"
  const displayName = userData?.username || userData?.email?.split('@')[0] || 'there'
  // Get balance or fallback to 0
  const userBalance = balance?.availableBalance || balance?.amount || 0

  const loading = userLoading || orgsLoading || payrollLoading || investmentLoading

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Good morning, {loading ? '...' : displayName} 👋
        </h2>
        <p className="text-slate-600 mt-1">Here's what's happening with your personal and business finances today.</p>
      </div>

      {/* SECTION A: Personal Finance View */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Personal Finance</h3>
        
        {/* Hero Stats - 4 metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Personal USDC Balance */}
          <div className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Personal Balance</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? '...' : formatCurrency(userBalance)}
                </p>
                <p className="text-xs text-slate-600 flex items-center mt-1">
                  <Wallet className="h-3 w-3 mr-1" />
                  USDC
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Total Invested */}
          <div className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Invested</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(personalHoldings.totalInvested)}
                </p>
                <p className="text-xs text-sky-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Growing
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Yield Generated */}
          <div className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Yield Generated</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(personalHoldings.yieldGenerated)}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  {formatPercentage(personalHoldings.yieldPercentage)}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Auto-Invest Status */}
          <div className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Auto-Invest</p>
                <p className="text-3xl font-bold text-slate-900">
                  {personalHoldings.autoInvestEnabled ? 'Active' : 'Paused'}
                </p>
                <p className="text-xs text-sky-600 flex items-center mt-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Automated
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Growth Chart & Incoming Payroll */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Growth Chart */}
          <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Investment Growth</CardTitle>
              <CardDescription>Auto-invest performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <InvestmentTrendChart data={growthHistory} />
            </CardContent>
          </Card>

          {/* Incoming Payroll Card */}
          <Card className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Incoming Payroll</CardTitle>
                  <CardDescription>Your payroll streams</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  {payrollStreams.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {payrollStreams.length > 0 ? (
                <div className="space-y-3">
                  {payrollStreams.slice(0, 3).map((stream) => (
                    <div key={stream.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200/50">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{stream.employee.name}</p>
                        <p className="text-xs text-slate-600">{stream.cadence}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(stream.amountMonthly)}</p>
                        {stream.nextRunAt && (
                          <p className="text-xs text-slate-500">
                            {new Date(stream.nextRunAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No active payroll streams</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION B: Available Investment Strategies */}
      {availableStrategies.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">Investment Opportunities</h3>
            <Badge variant="secondary" className="bg-sky-100 text-sky-700">
              {availableStrategies.length} strategies
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableStrategies.slice(0, 3).map((strategy) => (
              <Card key={strategy.id} className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">{strategy.name}</CardTitle>
                      <CardDescription className="text-sm">{strategy.asset}</CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={
                        strategy.riskLevel === 'low' ? 'bg-sky-100 text-sky-700' :
                        strategy.riskLevel === 'high' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {strategy.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Current APY</p>
                      <p className="text-3xl font-bold text-blue-600">{strategy.apy.toFixed(2)}%</p>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700">
                      Invest Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SECTION C: Business Treasury View */}
      {managedOrganizations.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">Business Treasury</h3>
          
          {managedOrganizations.map((org) => (
            <Card key={org.id} className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">{org.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                          {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/organization/${org.id}`)}
                  >
                    View Full Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Business Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Current USDC Balance */}
                  <div className="bg-white/60 rounded-xl border border-slate-200/50 p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Treasury Balance</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(org.balance)}</p>
                    <p className="text-xs text-sky-600 flex items-center mt-1">
                      <Wallet className="h-3 w-3 mr-1" />
                      USDC
                    </p>
                  </div>

                  {/* Next Paycheck Date */}
                  <div className="bg-white/60 rounded-xl border border-slate-200/50 p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Next Paycheck</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {org.nextPaycheckDate 
                        ? new Date(org.nextPaycheckDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'
                      }
                    </p>
                    <p className="text-xs text-slate-600 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Upcoming
                    </p>
                  </div>

                  {/* Upcoming Payroll Obligations */}
                  <div className="bg-white/60 rounded-xl border border-slate-200/50 p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Monthly Payroll</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(org.monthlyPayrollObligation)}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {org.activeStreamCount} streams
                    </p>
                  </div>

                  {/* Payroll Runway */}
                  <div className="bg-white/60 rounded-xl border border-slate-200/50 p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Payroll Runway</p>
                    <p className={
                      `text-2xl font-bold ${
                        org.payrollRunway === Infinity ? 'text-slate-400' :
                        org.payrollRunway < 3 ? 'text-rose-600' :
                        org.payrollRunway < 6 ? 'text-sky-600' :
                        'text-blue-600'
                      }`
                    }>
                      {org.payrollRunway === Infinity ? '∞' : `${org.payrollRunway.toFixed(1)}m`}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {org.payrollRunway < 3 && org.payrollRunway !== Infinity ? 'Low' : 'Healthy'}
                    </p>
                  </div>
                </div>

                {/* Balance vs Next Payroll */}
                <div className="bg-white/60 rounded-xl border border-slate-200/50 p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">Balance vs Next Payroll</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(org.balance)} / {formatCurrency(org.upcomingPayrollObligation)}
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={
                        `h-2 rounded-full transition-all ${
                          org.balance < org.upcomingPayrollObligation ? 'bg-rose-500' :
                          org.balance < org.upcomingPayrollObligation * 2 ? 'bg-sky-500' :
                          'bg-blue-500'
                        }`
                      }
                      style={{ 
                        width: `${Math.min(100, (org.balance / (org.upcomingPayrollObligation || 1)) * 50)}%` 
                      }}
                    />
                  </div>
                  {org.balance < org.upcomingPayrollObligation && (
                    <p className="text-xs text-rose-600 flex items-center mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Balance below next payroll obligation
                    </p>
                  )}
                </div>

                {/* Team Overview */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-600" />
                      <span className="text-slate-600">{org.employeeCount} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-600" />
                      <span className="text-slate-600">{org.activeStreamCount} active streams</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}

