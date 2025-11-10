"use client"

import { useState } from "react"
import Image from "next/image"
import { Send, ExternalLink, Loader2, CheckCircle2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getGridUserId } from "@/lib/utils/cookies"
import { detectInputType, isValidSolanaAddress, isValidEmail } from "@/lib/utils/validation"

type Currency = 'SOL' | 'USDC'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  accountAddress: string
  solBalance: number
  usdcBalance: number
  onTransactionSuccess?: () => void
}

export function SendModal({ isOpen, onClose, accountAddress, solBalance, usdcBalance, onTransactionSuccess }: SendModalProps) {
  // Note: SOL transfers not supported with Grid smart accounts - only USDC
  const [currency, setCurrency] = useState<Currency>('USDC')
  const [recipient, setRecipient] = useState("")
  const [recipientInput, setRecipientInput] = useState("")
  const [searchingUser, setSearchingUser] = useState(false)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [txSignature, setTxSignature] = useState("")
  const [step, setStep] = useState<string>("")

  const currentBalance = currency === 'SOL' ? solBalance : usdcBalance

  // Handle email or address lookup
  const handleRecipientLookup = async (input: string) => {
    setSearchingUser(true)
    setError("")
    
    try {
      const inputType = detectInputType(input)
      
      if (inputType === 'email') {
        // Lookup user by email
        const response = await fetch(`/api/users/search?email=${encodeURIComponent(input)}`)
        const data = await response.json()
        
        if (data.success && data.found && data.user?.publicKey) {
          setRecipient(data.user.publicKey)
          setRecipientInput(input)
        } else {
          setError("User not found with this email")
          setRecipient("")
        }
      } else if (inputType === 'address') {
        // Try to lookup user by address, but allow direct address if not found
        try {
          const response = await fetch(`/api/users/search?address=${encodeURIComponent(input)}`)
          const data = await response.json()
          
          // Whether user is found or not, we can use the address directly
          setRecipient(input)
          setRecipientInput(input)
        } catch (err) {
          // Even if lookup fails, we can use the address directly
          setRecipient(input)
          setRecipientInput(input)
        }
      } else {
        setError("Please enter a valid email address or Solana address")
        setRecipient("")
      }
    } catch (err) {
      setError("Failed to lookup user")
      setRecipient("")
    } finally {
      setSearchingUser(false)
    }
  }

  const handleSend = async () => {
    setError("")
    setSuccess(false)
    setLoading(true)
    setStep("")

    try {
      // Validation
      if (!recipient) {
        setError("Please enter a recipient address")
        setLoading(false)
        return
      }

      const sendAmount = parseFloat(amount)
      if (isNaN(sendAmount) || sendAmount <= 0) {
        setError("Please enter a valid amount")
        setLoading(false)
        return
      }

      if (sendAmount > currentBalance) {
        setError(`Insufficient balance. You have ${currentBalance.toFixed(currency === 'SOL' ? 4 : 2)} ${currency}`)
        setLoading(false)
        return
      }

      // Get gridUserId from cookie (set during login)
      const gridUserId = getGridUserId()
      
      if (!gridUserId) {
        setError("Grid user ID not found. Please try logging in again.")
        setLoading(false)
        return
      }

      console.log('[SendModal] Starting secure two-step payment flow...')

      // Step 1: Prepare and sign payment (server-side only - sessionSecrets never exposed)
      setStep("Preparing and signing payment...")
      console.log('[SendModal] Step 1: Preparing and signing payment (server-side)')
      
      const prepareAndSignResponse = await fetch('/api/prepare-and-sign-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: accountAddress,
          toAddress: recipient,
          amount: sendAmount,
          gridUserId,
        }),
      })

      const prepareAndSignData = await prepareAndSignResponse.json()

      if (!prepareAndSignResponse.ok || !prepareAndSignData.success) {
        throw new Error(prepareAndSignData.error || 'Failed to prepare and sign payment')
      }

      const { signedTransactionPayload, address } = prepareAndSignData

      if (!signedTransactionPayload || !address) {
        throw new Error('No signed transaction payload received')
      }

      console.log('[SendModal] ✅ Payment prepared and signed (server-side)')

      // Step 2: Send signed transaction (backend)
      setStep("Sending transaction...")
      console.log('[SendModal] Step 2: Sending signed transaction')

      const confirmResponse = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          signedTransactionPayload: signedTransactionPayload,
          recipientEmail: isValidEmail(recipientInput) ? recipientInput : undefined,
          recipientAddress: recipient,
          amount: sendAmount,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok || !confirmData.success) {
        throw new Error(confirmData.error || 'Failed to send transaction')
      }

      console.log('[SendModal] ✅ Transaction sent successfully')

      // Success!
      setTxSignature(confirmData.signature)
      setSuccess(true)
      setStep("")
      
      // Refresh balance after successful transaction
      if (onTransactionSuccess) {
        onTransactionSuccess()
      }
      
      // Clear form
      setRecipient("")
      setRecipientInput("")
      setAmount("")

    } catch (err: any) {
      console.error('[SendModal] Payment failed:', err)
      
      // Provide helpful error messages
      let errorMessage = err.message || `Failed to send ${currency}. Please try again.`
      
      if (errorMessage.includes('session credentials')) {
        errorMessage = "Your session has expired. Please refresh the page and try again."
      } else if (errorMessage.includes('Unauthorized')) {
        errorMessage = "You need to log in to send payments."
      } else if (errorMessage.includes('payment intent')) {
        errorMessage = "Failed to prepare transaction. Please try again."
      } else if (errorMessage.includes('sign')) {
        errorMessage = "Failed to sign transaction. Please try again."
      } else if (errorMessage.includes('send transaction')) {
        errorMessage = "Failed to send transaction. Please check your balance and try again."
      }
      
      setError(errorMessage)
      setStep("")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setRecipient("")
      setRecipientInput("")
      setAmount("")
      setError("")
      setSuccess(false)
      setTxSignature("")
      setCurrency('USDC')
      onClose()
    }
  }

  const getSolscanUrl = (signature: string) => {
    return `https://solscan.io/tx/${signature}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden border-2 border-slate-200 flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Image
            src="/usdc.png"
            alt="USDC"
            fill
            className="object-cover"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/95 via-white/90 to-slate-50/95 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200/60 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-sky-100 p-2">
                <Send className="h-4 w-4 text-sky-600" />
              </span>
              Send USDC
            </DialogTitle>
            <p className="text-xs text-slate-600 mt-1">
              Transfer USDC instantly on Solana
            </p>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Success Message */}
            {success && txSignature && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <p className="font-semibold mb-2">Transaction sent successfully!</p>
                  <a
                    href={getSolscanUrl(txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 underline"
                  >
                    View on Solscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Balance Display */}
            <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Available Balance
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ${currentBalance.toFixed(2)} USDC
              </p>
            </div>

            {/* Email or Address */}
            <div className="space-y-1.5">
              <Label htmlFor="recipientInput" className="text-sm font-medium text-slate-700">
                Email or Solana Address
              </Label>
              <div className="space-y-2">
                <Input
                  id="recipientInput"
                  type="text"
                  placeholder="Enter email or Solana address..."
                  value={recipientInput}
                  onChange={(e) => {
                    setRecipientInput(e.target.value)
                    setRecipient("")
                  }}
                  onBlur={() => {
                    if (recipientInput && !recipient) {
                      handleRecipientLookup(recipientInput)
                    }
                  }}
                  disabled={loading || searchingUser}
                  className="bg-white/80 border-slate-300 focus:border-sky-500 focus:ring-sky-500 h-10"
                />
                {searchingUser && (
                  <p className="text-xs text-slate-500">Looking up recipient...</p>
                )}
                {recipient && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>{isValidEmail(recipientInput) ? 'User found and verified' : 'Valid Solana address'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount (USDC)
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="0"
                  max={currentBalance}
                  className="bg-white/80 border-slate-300 focus:border-sky-500 focus:ring-sky-500 pr-16 h-10"
                />
                <button
                  onClick={() => setAmount(currentBalance.toString())}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={loading || searchingUser || !recipient || !amount}
              className="w-full h-10 text-sm font-semibold mt-2"
              variant="neo"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step || "Sending..."}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send USDC
                </>
              )}
            </Button>

            {/* Fee Notice */}
            <p className="text-xs text-center text-slate-500">
              Network fees: ~$0.000005 SOL • Instant settlement
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

