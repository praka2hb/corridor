"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Bell,
  Plus,
  Landmark,
  Send,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"
import { SendModal } from "@/components/send-modal"
import { DepositModal } from "@/components/deposit-modal"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  signature: string
  direction: 'in' | 'out'
  counterparty: string
  amount: string
  currency: string
  descriptor: string
  time: string
  timestamp: string | number
  status: string
  type: string
  rawAmount: number
}

const quickActions = [
  {
    id: "deposit",
    label: "Deposit",
    description: "Add USDC from connected wallets or bank",
    icon: Plus,
  },
  {
    id: "bank",
    label: "To bank",
    description: "Bridge USDC to traditional rails",
    icon: Landmark,
  },
  {
    id: "send",
    label: "Send",
    description: "Transfer to team members instantly",
    icon: Send,
  },
  {
    id: "get-paid",
    label: "Get Paid",
    description: "Generate deposit requests or share link",
    icon: ArrowDownLeft,
  },
] as const

export function Payments() {
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const { userData, balances, loading, refreshBalance } = useUserData()

  // Get SOL and USDC balances
  const solBalance = balances.find(b => b.currency === 'SOL')
  const usdcBalance = balances.find(b => b.currency === 'USDC')
  
  // Debug logging
  console.log('[Payments] All balances:', balances)
  console.log('[Payments] SOL balance:', solBalance)
  console.log('[Payments] USDC balance:', usdcBalance)
  
  // For display purposes, show USDC as the primary balance
  // In the future, you can add SOL price conversion to show total USD value
  const displayBalance = usdcBalance?.amount || 0

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.accountAddress) return
      
      try {
        setLoadingTransactions(true)
        const response = await fetch('/api/transactions')
        const result = await response.json()
        
        console.log('[Payments] Raw API response:', result)
        
        if (result.success && result.data?.success && result.data?.data) {
          // Transform Grid's transfer data to our Transaction format
          const gridTransfers = result.data.data
          console.log('[Payments] Grid transfers:', gridTransfers)
          
          const transformedTransactions: Transaction[] = gridTransfers.map((transfer: any) => {
            const splData = transfer.Spl
            
            // Determine direction based on user's account
            const isOutgoing = splData.from_address === userData?.accountAddress || 
                               splData.main_account_address === userData?.accountAddress
            
            // Get counterparty address (the "other" party)
            const counterparty = isOutgoing ? splData.to_address : splData.from_address
            
            // Format time
            const createdDate = new Date(splData.created_at)
            const now = new Date()
            const diffMs = now.getTime() - createdDate.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)
            
            let timeStr = ''
            if (diffMins < 1) timeStr = 'Just now'
            else if (diffMins < 60) timeStr = `${diffMins}m ago`
            else if (diffHours < 24) timeStr = `${diffHours}h ago`
            else timeStr = `${diffDays}d ago`
            
            // Get currency symbol from mint
            let currency = 'USDC'
            if (splData.mint === 'So11111111111111111111111111111111111111112') {
              currency = 'SOL'
            }
            
            return {
              id: splData.id,
              signature: splData.signature,
              direction: isOutgoing ? 'out' : 'in',
              counterparty: `${counterparty.slice(0, 4)}...${counterparty.slice(-4)}`,
              amount: splData.ui_amount, // Use the decimal amount
              currency,
              descriptor: `${currency} Transfer`,
              time: timeStr,
              timestamp: splData.created_at,
              status: splData.confirmation_status === 'confirmed' ? 'Completed' : 'Pending',
              type: 'transfer',
              rawAmount: parseFloat(splData.amount)
            }
          })
          
          console.log('[Payments] Transformed transactions:', transformedTransactions.length)
          setTransactions(transformedTransactions)
        }
      } catch (error) {
        console.error('[Payments] Error fetching transactions:', error)
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [userData?.accountAddress])

  // Refresh transactions after successful send
  const handleTransactionSuccess = () => {
    refreshBalance()
    // Refetch transactions
    fetch('/api/transactions')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data?.success && result.data?.data) {
          const gridTransfers = result.data.data
          
          const transformedTransactions: Transaction[] = gridTransfers.map((transfer: any) => {
            const splData = transfer.Spl
            const isOutgoing = splData.from_address === userData?.accountAddress || 
                               splData.main_account_address === userData?.accountAddress
            const counterparty = isOutgoing ? splData.to_address : splData.from_address
            
            const createdDate = new Date(splData.created_at)
            const now = new Date()
            const diffMs = now.getTime() - createdDate.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)
            
            let timeStr = ''
            if (diffMins < 1) timeStr = 'Just now'
            else if (diffMins < 60) timeStr = `${diffMins}m ago`
            else if (diffHours < 24) timeStr = `${diffHours}h ago`
            else timeStr = `${diffDays}d ago`
            
            let currency = 'USDC'
            if (splData.mint === 'So11111111111111111111111111111111111111112') {
              currency = 'SOL'
            }
            
            return {
              id: splData.id,
              signature: splData.signature,
              direction: isOutgoing ? 'out' : 'in',
              counterparty: `${counterparty.slice(0, 4)}...${counterparty.slice(-4)}`,
              amount: splData.ui_amount,
              currency,
              descriptor: `${currency} Transfer`,
              time: timeStr,
              timestamp: splData.created_at,
              status: splData.confirmation_status === 'confirmed' ? 'Completed' : 'Pending',
              type: 'transfer',
              rawAmount: parseFloat(splData.amount)
            }
          })
          
          setTransactions(transformedTransactions)
        }
      })
      .catch(err => console.error('Error refreshing transactions:', err))
  }

  const handleQuickAction = (actionId: string) => {
    if (actionId === "send") {
      setSendModalOpen(true)
    } else if (actionId === "deposit") {
      setDepositModalOpen(true)
    }
    // Handle other actions here
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">Payments & Treasury</h1>
          <p className="text-slate-600">Manage USDC liquidity, pay teams, and monitor programmable payouts.</p>
        </div>

        {/* Balance Overview */}
        <section className="grid gap-6 xl:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-xl xl:col-span-2">
            <div className="pointer-events-none absolute right-[-8%] top-[-15%] h-64 w-64 opacity-30">
              <Image src="/usdc.png" alt="USDC token" fill className="object-contain" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/60 via-white/50 to-white/20"></div>

            <div className="relative z-10 flex flex-col gap-8 p-8 md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Your Wallet</p>
                  <h2 className="mt-4 text-5xl font-semibold text-slate-900">
                    {loading ? '...' : `$${displayBalance.toFixed(2)}`}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">USDC on Solana</p>
                  
                  {/* Show all balances as badges */}
                  {!loading && balances.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {balances.map((bal, idx) => (
                        <Badge 
                          key={idx} 
                          variant={bal.currency === 'USDC' ? 'default' : 'outline'}
                          className={bal.currency === 'SOL' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                        >
                          {bal.amount.toFixed(bal.currency === 'SOL' ? 4 : 2)} {bal.currency}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button variant="neo" size="sm" className="px-4">
                    <Wallet className="mr-2 h-4 w-4" />
                    Manage Wallets
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Streaming Out (24h)</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">$12,900</p>
                  <p className="text-xs text-emerald-500">+4.1% vs yesterday</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available to Deploy</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">$42,730</p>
                  <p className="text-xs text-slate-500">Ready for one-click payroll</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Yield Vault</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">$18,400</p>
                  <p className="text-xs text-sky-500">Earning 3.8% APY</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Compliance Buffer</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">$8,420</p>
                  <p className="text-xs text-slate-500">Segregated for tax & filings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-900/20 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/80 to-slate-900/90"></div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-40">
              <Image src="/usdc.png" alt="USDC icon" fill className="object-contain" />
            </div>
            <div className="relative z-10 flex h-full flex-col gap-6 p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">Settlement Guard</p>
              </div>
              <h3 className="text-2xl font-semibold text-white">Automated Compliance</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Corridor continuously monitors every transfer, ensures travel rule compliance, and prepares audit-ready exports for tax filings.
              </p>
              <Button variant="neoOutline" size="sm" className="self-start border-white/30 bg-white/10 text-white hover:bg-white/20">
                Review Controls
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

                {/* Send Modal */}
        {sendModalOpen && (
          <SendModal
            isOpen={sendModalOpen}
            onClose={() => setSendModalOpen(false)}
            accountAddress={userData?.accountAddress || ""}
            solBalance={solBalance?.amount || 0}
            usdcBalance={usdcBalance?.amount || 0}
            onTransactionSuccess={handleTransactionSuccess}
          />
        )}

        {/* Deposit Modal */}
        {depositModalOpen && (
          <DepositModal
            isOpen={depositModalOpen}
            onClose={() => setDepositModalOpen(false)}
            accountAddress={userData?.accountAddress || ""}
          />
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="group flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/75 p-6 text-left shadow transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-full bg-sky-100 p-3 text-sky-600 shadow-inner">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-sky-500" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{action.label}</h4>
                  <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                </div>
              </button>
            )
          })}
        </section>

        {/* Recent Transfers */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Recent USDC Activity</h3>
                <p className="text-sm text-slate-500">Streaming settlements, reimbursements, and treasury moves.</p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                View all
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-slate-500">Loading transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Send className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No transactions yet</p>
                  <p className="text-xs text-slate-500 mt-1">Your transaction history will appear here</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-full",
                          transfer.direction === "in" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}
                      >
                        {transfer.direction === "in" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{transfer.descriptor}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {transfer.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-semibold",
                        transfer.direction === "in" ? "text-emerald-600" : "text-red-600"
                      )}>
                        {transfer.direction === "in" ? "+" : "-"}{transfer.currency === 'SOL' ? '' : '$'}{transfer.amount}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-none bg-slate-100 text-slate-600",
                          transfer.status === "Completed" && "bg-emerald-100 text-emerald-600",
                          transfer.status === "completed" && "bg-emerald-100 text-emerald-600",
                          transfer.status === "Pending" && "bg-amber-100 text-amber-600",
                          transfer.status === "pending" && "bg-amber-100 text-amber-600"
                        )}
                      >
                        {transfer.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">Counterparty Health</h3>
            <p className="text-sm text-slate-500">Monitor counterparties, their verification status, and velocity caps.</p>

            <div className="space-y-3">
              {["Orbit Design Studio", "LayerZero Ops", "Velocity Labs"].map((name) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">Verified • Limit $50k / 24h</p>
                    </div>
                  </div>
                  <Badge className="border-none bg-emerald-100 text-emerald-600">Trusted</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
    </div>
  )
}
