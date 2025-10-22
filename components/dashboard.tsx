"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Bell,
  Plus,
  Send,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  DollarSign,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"


const recentPayrolls = [
  { id: 1, date: "Dec 15, 2024", amount: "$45,250.00", employees: 18, status: "completed" },
  { id: 2, date: "Dec 1, 2024", amount: "$45,250.00", employees: 18, status: "completed" },
  { id: 3, date: "Nov 15, 2024", amount: "$43,100.00", employees: 17, status: "completed" },
]

const recentTransactions = [
  { id: 1, type: "sent", user: "@juan_dev", amount: 25.00, time: "2 hours ago" },
  { id: 2, type: "received", user: "@maria_biz", amount: 500.00, time: "1 day ago" },
  { id: 3, type: "sent", user: "@alex_design", amount: 75.50, time: "2 days ago" },
  { id: 4, type: "received", user: "@crypto_sam", amount: 120.00, time: "3 days ago" },
]

const pendingItems = [
  { id: 1, type: "payroll", title: "December Payroll Review", description: "18 employees • $45,250.00 total", urgent: true },
  { id: 2, type: "request", title: "Payment Request from @sarah_ops", description: "$150.00 for project completion", urgent: false },
  { id: 3, type: "approval", title: "New Team Member Setup", description: "Add Alex Chen to payroll system", urgent: false },
]

export function Dashboard() {
  const { userData, balance, loading } = useUserData()

  // Get username or fallback to email or "there"
  const displayName = userData?.username || userData?.email?.split('@')[0] || 'there'
  // Get balance or fallback to 0
  const userBalance = balance?.availableBalance || balance?.amount || 0

  return (
    <div className="space-y-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Good morning, {loading ? '...' : displayName} 👋
            </h2>
            <p className="text-slate-600 mt-1">Here's what's happening with your business and personal finances today.</p>
          </div>

          {/* Quick Actions - Reduced */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="flex gap-3">
              <Button 
                size="sm" 
                variant="neo"
                className="flex-1 h-12 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Payroll
              </Button>
              <Button 
                size="sm"
                variant="neoOutline"
                className="flex-1 h-12 text-sm font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Funds
              </Button>
            </div>
          </div>

          {/* Network & Treasury Status
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
              <Image
                src="/solana.jpg"
                alt="Solana network background"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-950/85 to-purple-900/70"></div>
              <div className="relative p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-purple-300/80">Solana Network</p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">Mainnet Status</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-300"></span>
                    Healthy
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-purple-200/70">Live TPS</p>
                    <p className="mt-2 text-xl font-semibold text-white">3,240</p>
                    <p className="text-xs text-purple-100/70">~65k capacity</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-purple-200/70">Avg Fee</p>
                    <p className="mt-2 text-xl font-semibold text-white">$0.0009</p>
                    <p className="text-xs text-purple-100/70">Per transaction</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-purple-200/70">Block Time</p>
                    <p className="mt-2 text-xl font-semibold text-white">412 ms</p>
                    <p className="text-xs text-purple-100/70">Last sampled</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-purple-200/70">Uptime</p>
                    <p className="mt-2 text-xl font-semibold text-white">99.9%</p>
                    <p className="text-xs text-purple-100/70">30-day</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
              <Image
                src="/usdc.png"
                alt="USDC token background"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain opacity-40 scale-150 -translate-y-4"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-sky-900/70"></div>
              <div className="relative p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-sky-300/80">USDC Treasury</p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">Liquidity Snapshot</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-200">
                    <TrendingUp className="h-4 w-4" />
                    +3.2% WoW
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-sky-100/70">Contract Balance</p>
                    <p className="mt-2 text-xl font-semibold text-white">$3.6M</p>
                    <p className="text-xs text-sky-100/70">Custodied funds</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-sky-100/70">Streaming Out</p>
                    <p className="mt-2 text-xl font-semibold text-white">$182K</p>
                    <p className="text-xs text-sky-100/70">Next 7 days</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-sky-100/70">Yield Earned</p>
                    <p className="mt-2 text-xl font-semibold text-white">$12.4K</p>
                    <p className="text-xs text-sky-100/70">Season to date</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-sky-100/70">Idle Funds</p>
                    <p className="mt-2 text-xl font-semibold text-white">$410K</p>
                    <p className="text-xs text-sky-100/70">Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">$542.3K</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Employees Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Employees</p>
                  <p className="text-2xl font-bold text-slate-900">18</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    2 new this month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Payments Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                  <p className="text-xs text-amber-600 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    $2,450 total
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Yield Earned Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Yield Earned</p>
                  <p className="text-2xl font-bold text-slate-900">$1,234</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    2.4% APY
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Team Activity Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Team Activity</h3>
              <Button variant="ghost" size="sm" className="text-slate-600">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">SA</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Sarah Adams completed timesheet</p>
                  <p className="text-xs text-slate-600">2 hours ago</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">MC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Mike Chen requested time off</p>
                  <p className="text-xs text-slate-600">4 hours ago</p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">JL</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Jessica Liu updated payment details</p>
                  <p className="text-xs text-slate-600">1 day ago</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Dashboard Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Overview Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">My Company Overview</h3>
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <div className="text-2xl font-bold text-slate-900">18</div>
                  <div className="text-sm text-slate-600">Total Employees</div>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-600">Jan 1</div>
                  <div className="text-sm text-slate-600">Next Payroll</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recent Payrolls</h4>
                <div className="space-y-3">
                  {recentPayrolls.map((payroll) => (
                    <div key={payroll.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900">{payroll.date}</div>
                        <div className="text-sm text-slate-600">{payroll.employees} employees</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">{payroll.amount}</div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Wallet Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Personal Wallet</h3>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {loading ? '...' : `$${userBalance.toFixed(2)}`}
                </div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  USDC Balance
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    +2.4% yield
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recent Transactions</h4>
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'sent' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {tx.type === 'sent' ? (
                            <Send className="h-4 w-4 text-red-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {tx.type === 'sent' ? 'Paid' : 'Received from'} {tx.user}
                          </div>
                          <div className="text-sm text-slate-600">{tx.time}</div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        tx.type === 'sent' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {tx.type === 'sent' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals / Notifications Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Pending Approvals & Notifications</h3>
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.urgent ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      {item.type === 'payroll' && <DollarSign className="h-5 w-5 text-amber-600" />}
                      {item.type === 'request' && <Send className="h-5 w-5 text-teal-600" />}
                      {item.type === 'approval' && <Users className="h-5 w-5 text-slate-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-600">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.urgent && (
                      <Badge variant="destructive" className="bg-amber-100 text-amber-700 border-amber-200">
                        Urgent
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
        </div>
    </div>
  )
}

