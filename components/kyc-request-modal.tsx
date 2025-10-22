"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Building, User, Loader2, AlertCircle, Shield, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface KycRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KycRequestModal({ open, onOpenChange }: KycRequestModalProps) {
  const [kycType, setKycType] = useState<'individual' | 'business'>('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRequestKyc = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch('/api/kyc/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kycType }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate KYC link')
      }

      // Redirect to KYC link
      if (data.kycData?.kyc_link) {
        window.location.href = data.kycData.kyc_link
      }

    } catch (err: any) {
      console.error('Request KYC failed:', err)
      setError(err.message || 'Failed to generate KYC link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-sky-600" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            Complete KYC verification to unlock all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* KYC Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Select Verification Type
            </Label>
            <RadioGroup 
              value={kycType} 
              onValueChange={(value: 'individual' | 'business') => setKycType(value)}
              className="grid grid-cols-2 gap-4"
            >
              {/* Individual Option */}
              <div>
                <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                <Label
                  htmlFor="individual"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:bg-slate-50",
                    kycType === 'individual' 
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200" 
                      : "border-slate-200 bg-white"
                  )}
                >
                  <User className={cn(
                    "h-8 w-8 mb-2",
                    kycType === 'individual' ? "text-sky-600" : "text-slate-400"
                  )} />
                  <div className="text-center">
                    <div className="font-semibold text-sm mb-1">Individual</div>
                    <div className="text-xs text-slate-500">
                      Personal account
                    </div>
                  </div>
                </Label>
              </div>

              {/* Business Option */}
              <div>
                <RadioGroupItem value="business" id="business" className="peer sr-only" />
                <Label
                  htmlFor="business"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:bg-slate-50",
                    kycType === 'business' 
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200" 
                      : "border-slate-200 bg-white"
                  )}
                >
                  <Building className={cn(
                    "h-8 w-8 mb-2",
                    kycType === 'business' ? "text-sky-600" : "text-slate-400"
                  )} />
                  <div className="text-center">
                    <div className="font-semibold text-sm mb-1">Business</div>
                    <div className="text-xs text-slate-500">
                      Company account
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Requirements Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-slate-900">
              {kycType === 'individual' ? "What you'll need:" : "What your business will need:"}
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {kycType === 'individual' ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Valid government-issued ID (passport, driver's license)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Personal information (name, date of birth, address)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>5-10 minutes to complete verification</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Business registration documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>EIN/Tax ID number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Business address and contact information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Authorized representative's valid ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>10-15 minutes to complete</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestKyc}
              disabled={loading}
              className="flex-1"
              variant="neo"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Start Verification
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500">
            Your information is encrypted and securely processed by our verification provider
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
