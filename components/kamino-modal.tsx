"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface KaminoModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  employeeWallet: string
  usdcBalance: number
  onTransactionSuccess?: () => void
}

export function KaminoModal({
  isOpen,
  onClose,
  employeeId,
  employeeWallet,
  usdcBalance,
  onTransactionSuccess,
}: KaminoModalProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mock APY - in production, fetch from Kamino API
  const currentAPY = 4.2

  const handleDeposit = async () => {
    setError(null)
    setSuccess(null)

    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (depositAmount < 0.01) {
      setError("Minimum deposit is 0.01 USDC")
      return
    }

    if (depositAmount > usdcBalance) {
      setError("Insufficient USDC balance")
      return
    }

    setLoading(true)

    try {
      // Step 1: Prepare transaction
      const prepareResponse = await fetch("/api/investments/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          assetSymbol: "USDC",
          amount: depositAmount,
          employeeWallet,
          idempotencyKey: `deposit_${Date.now()}_${Math.random()}`,
        }),
      })

      const prepareResult = await prepareResponse.json()

      if (!prepareResult.success) {
        throw new Error(prepareResult.error || "Failed to prepare transaction")
      }

      const { serializedTransaction, ledgerId } = prepareResult.data

      // Step 2: Sign transaction with employee's wallet
      // In a real implementation, this would use Grid SDK or Solana wallet adapter
      // For now, we'll show a placeholder
      console.log("[Kamino Modal] Transaction prepared:", {
        serializedTransaction,
        ledgerId,
      })

      // TODO: Implement actual signing with Grid SDK
      // const signedTx = await signTransactionWithGrid(serializedTransaction)
      
      // For demo purposes, simulate signing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Submit signed transaction
      // const confirmResponse = await fetch("/api/investments/confirm", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     employeeId,
      //     transactionSignature: signedTx.signature,
      //     ledgerId,
      //   }),
      // })

      // const confirmResult = await confirmResponse.json()

      // if (!confirmResult.success) {
      //   throw new Error(confirmResult.error || "Transaction failed")
      // }

      setSuccess(`Successfully deposited ${depositAmount} USDC to Kamino Lend!`)
      setAmount("")
      
      // Refresh balances
      if (onTransactionSuccess) {
        onTransactionSuccess()
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error("[Kamino Modal] Deposit failed:", err)
      setError(err instanceof Error ? err.message : "Deposit failed")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    setError(null)
    setSuccess(null)

    const withdrawAmount = parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      // Step 1: Prepare withdrawal transaction
      const prepareResponse = await fetch("/api/investments/unstake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          assetSymbol: "USDC",
          amount: withdrawAmount,
          employeeWallet,
          idempotencyKey: `withdraw_${Date.now()}_${Math.random()}`,
        }),
      })

      const prepareResult = await prepareResponse.json()

      if (!prepareResult.success) {
        throw new Error(prepareResult.error || "Failed to prepare transaction")
      }

      const { serializedTransaction, ledgerId } = prepareResult.data

      // Step 2: Sign and submit (same as deposit)
      console.log("[Kamino Modal] Withdrawal prepared:", {
        serializedTransaction,
        ledgerId,
      })

      // TODO: Implement actual signing and confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(`Successfully withdrew ${withdrawAmount} USDC from Kamino Lend!`)
      setAmount("")
      
      if (onTransactionSuccess) {
        onTransactionSuccess()
      }

      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error("[Kamino Modal] Withdrawal failed:", err)
      setError(err instanceof Error ? err.message : "Withdrawal failed")
    } finally {
      setLoading(false)
    }
  }

  const handleMaxClick = () => {
    if (activeTab === "deposit") {
      setAmount(usdcBalance.toString())
    }
    // For withdraw, we'd need to fetch the deposited balance
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Kamino Lend
          </DialogTitle>
          <DialogDescription>
            Earn yield on your USDC with Kamino's lending protocol
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900">Current APY</p>
              <p className="text-2xl font-bold text-emerald-600">{currentAPY}%</p>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Variable Rate
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "deposit" | "withdraw")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USDC)</Label>
              <div className="flex gap-2">
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  min="0.01"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={handleMaxClick}
                  disabled={loading}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Available: {usdcBalance.toFixed(2)} USDC
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">Estimated earnings</p>
              <p className="text-slate-600">
                {amount && !isNaN(parseFloat(amount))
                  ? `~$${((parseFloat(amount) * currentAPY) / 100).toFixed(2)} per year`
                  : "$0.00 per year"}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={loading || !amount}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Deposit to Kamino"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
              <div className="flex gap-2">
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  min="0.01"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={handleMaxClick}
                  disabled={loading}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Deposited: -- USDC (fetch from position)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={loading || !amount}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Withdraw from Kamino"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700 mb-1">How it works</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Deposits are secured by Kamino's audited smart contracts</li>
            <li>Interest accrues automatically in real-time</li>
            <li>Withdraw anytime (subject to protocol liquidity)</li>
            <li>Transactions are signed with your Grid wallet</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
