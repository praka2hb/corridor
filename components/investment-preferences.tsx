"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface KaminoStrategy {
  id: string
  strategyId: string
  symbol: string
  asset: string
  apy: number
  riskLabel?: string
  allowlisted: boolean
  // Lend-specific fields
  borrowAPY?: number
  utilizationRate?: number
  totalDeposits?: number
  availableLiquidity?: number
  cTokenMint?: string
}

interface Position {
  employeeId: string
  provider: string
  strategyId: string
  symbol: string
  shares: number
  estimatedValue: number
  apy?: number
}

interface InvestmentPreferencesProps {
  employeeId: string
}

export function InvestmentPreferences({ employeeId }: InvestmentPreferencesProps) {
  // Phase 2: Back to server-side API calls (production-ready)
  const [strategies, setStrategies] = useState<KaminoStrategy[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<string>("")
  const [stakeAmount, setStakeAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [strategiesLoading, setStrategiesLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Fetch strategies and positions on mount
  useEffect(() => {
    fetchStrategies()
    fetchPositions()
  }, [employeeId])

  const fetchStrategies = async () => {
    try {
      setStrategiesLoading(true)
      // Use server-side API endpoint (no WASM issues!)
      const response = await fetch('/api/investments/strategies?type=lend')
      const data = await response.json()
      if (data.success) {
        setStrategies(data.data)
        if (data.data.length > 0 && !selectedStrategy) {
          setSelectedStrategy(data.data[0].strategyId)
        }
      } else {
        console.error('Failed to fetch strategies:', data.error)
        setError('Failed to load investment strategies')
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err)
      setError('Failed to load investment strategies')
    } finally {
      setStrategiesLoading(false)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch(`/api/investments/positions?employeeId=${employeeId}`)
      const data = await response.json()
      if (data.success) {
        setPositions(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err)
    }
  }

  const handleStake = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const amount = parseFloat(stakeAmount)
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount")
        setLoading(false)
        return
      }

      const selectedStrategyData = strategies.find(s => s.strategyId === selectedStrategy)
      if (!selectedStrategyData) {
        setError("Selected strategy not found")
        setLoading(false)
        return
      }

      const idempotencyKey = `stake_${employeeId}_${selectedStrategy}_${Date.now()}`

      // Use new deposit format with assetSymbol
      const response = await fetch('/api/investments/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          assetSymbol: selectedStrategyData.symbol,
          amount,
          idempotencyKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Deposited ${amount} ${selectedStrategyData.symbol} successfully! Tx: ${data.data.txSig.substring(0, 12)}...`)
        setStakeAmount("")
        fetchPositions() // Refresh positions
      } else {
        setError(data.error || "Deposit operation failed")
      }
    } catch (err) {
      setError("Failed to deposit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async (strategyId: string, shares: number) => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Find the strategy to get the symbol
      const strategy = strategies.find(s => s.strategyId === strategyId)
      if (!strategy) {
        setError("Strategy not found")
        setLoading(false)
        return
      }

      const idempotencyKey = `unstake_${employeeId}_${strategyId}_${Date.now()}`

      // Use new withdraw format with assetSymbol
      const response = await fetch('/api/investments/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          assetSymbol: strategy.symbol,
          shares,
          idempotencyKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Withdrew ${shares} ${strategy.symbol} successfully!`)
        fetchPositions() // Refresh positions
      } else {
        setError(data.error || "Withdraw operation failed")
      }
    } catch (err) {
      setError("Failed to withdraw. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedStrategyData = strategies.find(s => s.strategyId === selectedStrategy)

  return (
    <div className="space-y-6">
      {/* Strategies Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Kamino Lend
          </CardTitle>
          <CardDescription>
            Deposit assets into Kamino Lend reserves to earn competitive yields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show operation errors */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {strategiesLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading reserves from Kamino...
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No reserves available
            </div>
          ) : (
            <>
              {/* Strategy Selection */}
              <div className="space-y-2">
                <Label>Select Reserve</Label>
                <div className="grid gap-3">
                  {strategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy.strategyId)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        selectedStrategy === strategy.strategyId
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {strategy.symbol}
                          </div>
                          <div className="text-sm text-slate-600">{strategy.asset}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-teal-600">
                            {strategy.apy.toFixed(2)}%
                          </div>
                          <div className="text-xs text-slate-500">Deposit APY</div>
                        </div>
                      </div>
                      
                      {/* Lend-specific metrics */}
                      {strategy.utilizationRate !== undefined && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                          <div>
                            <div className="text-xs text-slate-500">Utilization</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {strategy.utilizationRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Borrow APY</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {strategy.borrowAPY?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {strategy.riskLabel && (
                        <Badge variant="secondary" className="mt-2">
                          {strategy.riskLabel}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit Amount */}
              <div className="space-y-2">
                <Label htmlFor="stakeAmount">Amount ({selectedStrategyData?.symbol || 'Asset'})</Label>
                <Input
                  id="stakeAmount"
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="1"
                  max="10000"
                  step="0.01"
                />
                <p className="text-xs text-slate-500">
                  Min: 1, Max: 10,000 per transaction
                </p>
              </div>

              {/* Deposit Button */}
              <Button
                onClick={handleStake}
                disabled={loading || !stakeAmount || !selectedStrategy}
                className="w-full"
                variant="neo"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Deposit {selectedStrategyData?.symbol || 'Assets'}
                  </>
                )}
              </Button>

              {selectedStrategyData && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-sm">
                    <strong>Risk Disclosure:</strong> Lending involves risks including
                    smart contract risk and protocol risk. Only deposit what you can afford to lose.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Positions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
          <CardDescription>
            Active staking positions and estimated values
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No active positions yet
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={`${position.provider}_${position.strategyId}`}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {position.symbol}
                      </div>
                      <div className="text-sm text-slate-600">
                        {position.shares.toFixed(2)} shares
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        ${position.estimatedValue.toFixed(2)}
                      </div>
                      {position.apy && (
                        <div className="text-xs text-teal-600">
                          {position.apy.toFixed(2)}% APY
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleUnstake(position.strategyId, position.shares)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Unstake All
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

