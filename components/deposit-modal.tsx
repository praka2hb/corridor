"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  accountAddress: string
}

export function DepositModal({ isOpen, onClose, accountAddress }: DepositModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(accountAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleViewOnExplorer = () => {
    window.open(`https://solscan.io/account/${accountAddress}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Deposit USDC</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-6 shadow-lg border-2 border-slate-200">
              <QRCodeSVG 
                value={accountAddress}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-slate-600 text-center max-w-xs">
              Scan this QR code to get your wallet address
            </p>
          </div>

          {/* Address Display */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">
              Your Solana Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-mono text-sm text-slate-900 break-all border border-slate-200">
                {accountAddress}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyAddress}
                className="h-10 w-10 shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Address copied to clipboard
              </p>
            )}
          </div>

          {/* Important Information */}
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 space-y-2">
            <h4 className="font-semibold text-sky-900 text-sm">Important:</h4>
            <ul className="text-xs text-sky-800 space-y-1 list-disc list-inside">
              <li>Only send USDC on the Solana network</li>
              <li>Sending other tokens may result in permanent loss</li>
              <li>Ensure the sending wallet supports SPL tokens</li>
              <li>Deposits typically arrive within seconds</li>
            </ul>
          </div>

          {/* Network Information */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Network</p>
                <p className="font-semibold text-slate-900">Solana</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Token</p>
                <p className="font-semibold text-slate-900">USDC (SPL)</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-1">Token Address</p>
                <p className="font-mono text-xs text-slate-700 break-all">
                  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleViewOnExplorer}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Solscan
            </Button>
            <Button
              variant="neo"
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
