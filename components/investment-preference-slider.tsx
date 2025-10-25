"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Info,
  Loader2,
  CheckCircle
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface InvestmentPreferenceSliderProps {
  monthlyPayroll: number
  currentPercentage?: number
  onSave?: (percentage: number) => void
}

export function InvestmentPreferenceSlider({ 
  monthlyPayroll, 
  currentPercentage = 0,
  onSave 
}: InvestmentPreferenceSliderProps) {
  const [percentage, setPercentage] = useState(currentPercentage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPercentage(currentPercentage)
  }, [currentPercentage])

  const investmentAmount = (monthlyPayroll * percentage) / 100
  const walletAmount = monthlyPayroll - investmentAmount

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSaved(false)

      const response = await fetch('/api/user/investment-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save preference')
      }

      setSaved(true)
      onSave?.(percentage)

      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save preference')
    } finally {
      setSaving(false)
    }
  }

  const hasChanged = percentage !== currentPercentage

  return (
    <Card className="bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          Investment Preference
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Choose how much of your payroll to automatically invest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Investment Percentage</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                {percentage}%
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Slider
              value={[percentage]}
              onValueChange={(value) => setPercentage(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            
            {/* Percentage markers */}
            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                0% (All to wallet)
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                100% (All to investment)
              </span>
            </div>
          </div>
        </div>

        {/* Split Visualization */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-200/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              <p className="text-sm font-semibold text-slate-800">To Investment</p>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              {formatCurrency(investmentAmount)}
            </p>
            <p className="text-xs text-slate-500">{percentage}% • ~5.2% APY</p>
          </div>

          <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-slate-600" />
              <p className="text-sm font-semibold text-slate-800">To Wallet</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(walletAmount)}
            </p>
            <p className="text-xs text-slate-500">{100 - percentage}% • Available now</p>
          </div>
        </div>

        {/* Info Alert
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <Info className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-xs text-blue-900">
            Applies to all payroll streams • Funds auto-invest in Kamino when received
          </AlertDescription>
        </Alert> */}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanged || saving}
          className="w-full h-10 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Save Preference
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
