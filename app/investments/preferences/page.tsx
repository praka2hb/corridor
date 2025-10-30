"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Info,
  PiggyBank,
  Shield,
  Bitcoin,
  Coins
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useUserData } from "@/hooks/use-user-data"
import { formatCurrency } from "@/lib/utils"

type InvestmentTab = 'lend' | 'dca'

interface LendingVault {
  id: string
  name: string
  apy: string
  profile: string
  risk: 'conservative' | 'balanced' | 'aggressive'
  description: string
  tvl?: string
}

interface DCAMarket {
  id: string
  symbol: string
  name: string
  icon?: React.ReactNode
  logo?: string
  currentPrice: string
  priceChange: string
  isNegative: boolean
  color: string
}

const lendingVaults: LendingVault[] = [
  {
    id: 'sentora-pyusd',
    name: 'Sentora PYUSD',
    apy: '11.64%',
    profile: 'Vault Profile',
    risk: 'balanced',
    description: 'Balanced risk lending vault with competitive yields',
    tvl: '$2.4M'
  },
  {
    id: 'cash-earn',
    name: 'CASH EARN',
    apy: '13.22%',
    profile: 'Vault Profile',
    risk: 'balanced',
    description: 'High-yield balanced vault for active lending',
    tvl: '$1.8M'
  },
  {
    id: 'usdg-prime',
    name: 'USDG Prime',
    apy: '7.93%',
    profile: 'Conservative Profile',
    risk: 'conservative',
    description: 'Secure, low-risk vault for conservative investors',
    tvl: '$5.2M'
  },
  {
    id: 'usdc-stable',
    name: 'USDC Stable',
    apy: '9.15%',
    profile: 'Vault Profile',
    risk: 'balanced',
    description: 'Stable USDC lending with consistent returns',
    tvl: '$3.6M'
  }
]

const dcaMarkets: DCAMarket[] = [
  {
    id: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    icon: <Bitcoin className="h-6 w-6" />,
    currentPrice: '$109,146',
    priceChange: '3.4%',
    isNegative: true,
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'weth',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    logo: '/eth.png',
    currentPrice: '$3,874',
    priceChange: '3.7%',
    isNegative: true,
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    logo: '/solana.jpg',
    currentPrice: '$192.22',
    priceChange: '1.5%',
    isNegative: true,
    color: 'from-violet-500 to-fuchsia-600'
  }
]

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'conservative':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'balanced':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'aggressive':
      return 'bg-orange-100 text-orange-700 border-orange-300'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300'
  }
}

export default function InvestmentPreferencesPage() {
  const router = useRouter()
  const { userData, balance } = useUserData()
  const [selectedTab, setSelectedTab] = useState<InvestmentTab>('lend')
  const [selectedVault, setSelectedVault] = useState<string | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [investmentPercentage, setInvestmentPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Payroll Data
  const [totalPayroll, setTotalPayroll] = useState(0)
  const [payrollFrequency, setPayrollFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')

  useEffect(() => {
    fetchCurrentPreferences()
    fetchPayrollData()
  }, [])

  const fetchCurrentPreferences = async () => {
    try {
      const response = await fetch('/api/investments/preferences')
      const data = await response.json()
      
      if (data.success) {
        setInvestmentPercentage(data.percentage || 0)
      }
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err)
    }
  }

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/payroll')
      const data = await response.json()
      
      if (data.success && data.streams && data.streams.length > 0) {
        // Get active streams
        const activeStreams = data.streams.filter((s: any) => s.status === 'active')
        
        if (activeStreams.length > 0) {
          // Calculate total monthly payroll
          const total = activeStreams.reduce((sum: number, stream: any) => sum + stream.amountMonthly, 0)
          setTotalPayroll(total)
          
          // Get the most common frequency
          const frequency = activeStreams[0].cadence || 'monthly'
          setPayrollFrequency(frequency)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch payroll data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess(false)

      const dcaAmount = (totalPayroll * investmentPercentage) / 100

      const response = await fetch('/api/investments/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: investmentPercentage,
          strategy: selectedTab,
          vaultId: selectedVault,
          marketId: selectedMarket,
          dcaParams: selectedTab === 'dca' ? {
            amount: dcaAmount,
            frequency: payrollFrequency
          } : null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Investment Preferences</h1>
          <p className="text-slate-600 mt-2">
            Choose how you want to grow your payroll automatically
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Preferences saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Interface */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as InvestmentTab)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="lend" className="text-base">
              <PiggyBank className="h-4 w-4 mr-2" />
              Lend
            </TabsTrigger>
            <TabsTrigger value="dca" className="text-base">
              <Calendar className="h-4 w-4 mr-2" />
              DCA
            </TabsTrigger>
          </TabsList>

          {/* Lend Tab Content */}
          <TabsContent value="lend" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lendingVaults.map((vault) => (
                <Card 
                  key={vault.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedVault === vault.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedVault(vault.id)}
                >
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <CardTitle className="text-base">{vault.name}</CardTitle>
                          {selectedVault === vault.id && (
                            <CheckCircle className="h-4 w-4 text-blue-600 ml-2" />
                          )}
                        </div>
                        <CardDescription className="text-xs">{vault.profile}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {/* APY Display */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-green-600">{vault.apy}</span>
                      <span className="text-xs text-slate-500">APY</span>
                    </div>

                    {/* Risk Badge and TVL */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${getRiskColor(vault.risk)} text-xs px-2 py-0`}>
                        <Shield className="h-2.5 w-2.5 mr-1" />
                        {vault.risk.charAt(0).toUpperCase() + vault.risk.slice(1)}
                      </Badge>
                      {vault.tvl && (
                        <span className="text-xs text-slate-500">TVL: {vault.tvl}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Investment Percentage Slider */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Allocation</CardTitle>
                <CardDescription>
                  Set what percentage of your payroll to invest automatically in the selected vault
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Investment Percentage</span>
                    <span className="text-2xl font-bold text-blue-600">{investmentPercentage}%</span>
                  </div>
                  
                  <Slider
                    value={[investmentPercentage]}
                    onValueChange={(value) => setInvestmentPercentage(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />

                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <Info className="h-4 w-4" />
                    <span>
                      {totalPayroll > 0 
                        ? `Your ${payrollFrequency} payroll: $${totalPayroll.toFixed(2)}`
                        : 'Set up payroll to see allocation'
                      }
                    </span>
                  </div>
                  {totalPayroll > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">To Lending</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${((totalPayroll * investmentPercentage) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">To Wallet</div>
                        <div className="text-lg font-bold text-slate-900">
                          ${(totalPayroll - (totalPayroll * investmentPercentage) / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving || !selectedVault}
                  className="w-full"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DCA Tab Content */}
          <TabsContent value="dca" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dcaMarkets.map((market) => (
                <Card 
                  key={market.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedMarket === market.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedMarket(market.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {market.logo ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white">
                            <Image 
                              src={market.logo} 
                              alt={market.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${market.color} text-white`}>
                            {market.icon}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{market.symbol}</CardTitle>
                          <CardDescription className="text-xs">{market.name}</CardDescription>
                        </div>
                      </div>
                      {selectedMarket === market.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-slate-900">{market.currentPrice}</div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {market.priceChange}
                      </span>
                      <span className="text-xs text-slate-500">24h</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* DCA Configuration */}
            {selectedMarket && totalPayroll > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>DCA Configuration</CardTitle>
                  <CardDescription>
                    Set up your dollar-cost averaging strategy for {dcaMarkets.find(m => m.id === selectedMarket)?.symbol}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payroll Info */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Your Payroll</span>
                      <span className="text-xl font-bold text-slate-900">
                        ${totalPayroll.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="h-3 w-3" />
                      <span className="capitalize">{payrollFrequency} payments</span>
                    </div>
                  </div>

                  {/* Investment Percentage Slider */}
                  <div className="space-y-2">
                    <Label>DCA Allocation</Label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[investmentPercentage]}
                          onValueChange={(value) => setInvestmentPercentage(value[0])}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-2xl font-bold text-blue-600 w-20 text-right">
                          {investmentPercentage}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      ${((totalPayroll * investmentPercentage) / 100).toFixed(2)} per {payrollFrequency} payment
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Auto-Investment Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">Per Payment</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${((totalPayroll * investmentPercentage) / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 capitalize">{payrollFrequency}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">Frequency</div>
                        <div className="text-lg font-bold text-green-600 capitalize">{payrollFrequency}</div>
                        <div className="text-xs text-slate-500 mt-1">Synced with payroll</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">Status</div>
                        <div className="text-lg font-bold text-slate-900">Continuous</div>
                        <div className="text-xs text-slate-500 mt-1">Runs automatically</div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                        <div className="text-xs text-indigo-900">
                          <p className="font-medium mb-1">Perpetual DCA Strategy</p>
                          <p className="text-indigo-700">
                            This will automatically invest {investmentPercentage}% of your payroll into {dcaMarkets.find(m => m.id === selectedMarket)?.symbol} with every payment. You can pause or adjust anytime.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave} 
                    disabled={saving || totalPayroll === 0 || investmentPercentage === 0}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate DCA Strategy
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedMarket && totalPayroll === 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-12 text-center">
                  <Info className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Payroll</h3>
                  <p className="text-slate-600 mb-4">
                    You need to have an active payroll stream to set up DCA investments.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/organization')}
                  >
                    View Organizations
                  </Button>
                </CardContent>
              </Card>
            )}

            {!selectedMarket && (
              <Card className="bg-slate-50">
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Market</h3>
                  <p className="text-slate-600">Choose a cryptocurrency to start your DCA strategy</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
