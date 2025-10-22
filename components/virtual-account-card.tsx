"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Copy, Check, AlertCircle, CreditCard } from "lucide-react";

interface VirtualAccountCardProps {
  organizationId: string;
  compact?: boolean;
}

interface VirtualAccountData {
  id: string;
  bankName: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  bankBeneficiaryName: string;
  destinationAddress: string;
}

export function VirtualAccountCard({ organizationId, compact = false }: VirtualAccountCardProps) {
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [needsKyc, setNeedsKyc] = useState(false);

  // Load virtual account on mount
  useState(() => {
    loadVirtualAccount();
  });

  async function loadVirtualAccount() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organization/${organizationId}/virtual-account`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      if (data.hasVirtualAccount) {
        setVirtualAccount(data.virtualAccount);
      }
    } catch (err: any) {
      console.error("Error loading virtual account:", err);
      // Don't show error if it just doesn't exist yet
      if (!err.message?.includes("not found")) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function requestVirtualAccount() {
    try {
      setLoading(true);
      setError(null);
      setNeedsKyc(false);

      const response = await fetch(`/api/organization/${organizationId}/virtual-account`, {
        method: "POST",
      });

      const data = await response.json();

      if (!data.success) {
        if (data.needsKyc) {
          setNeedsKyc(true);
          setError(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      // Extract virtual account data from response
      if (data.virtualAccount) {
        setVirtualAccount({
          id: data.virtualAccount.id,
          bankName: data.virtualAccount.depositInstructions?.bankName || data.virtualAccount.bankName,
          bankAccountNumber: data.virtualAccount.depositInstructions?.bankAccountNumber || data.virtualAccount.bankAccountNumber,
          bankRoutingNumber: data.virtualAccount.depositInstructions?.bankRoutingNumber || data.virtualAccount.bankRoutingNumber,
          bankBeneficiaryName: data.virtualAccount.depositInstructions?.bankBeneficiaryName || data.virtualAccount.bankBeneficiaryName,
          destinationAddress: data.virtualAccount.destination?.address || data.virtualAccount.destinationAddress || "",
        });
      }
    } catch (err: any) {
      console.error("Error requesting virtual account:", err);
      setError(err.message || "Failed to request virtual account");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  if (loading && !virtualAccount) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!virtualAccount) {
    if (compact) {
      return (
        <div className="space-y-3">
          {error && (
            <Alert variant={needsKyc ? "default" : "destructive"} className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          <Button 
            onClick={requestVirtualAccount} 
            disabled={loading}
            size="sm"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-3 w-3" />
                Set Up ACH
              </>
            )}
          </Button>
          <p className="text-[10px] text-slate-500">Get US bank account for deposits</p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Bank Deposits (ACH)</CardTitle>
          </div>
          <CardDescription>
            Get bank account details to fund your organization with USD via ACH transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant={needsKyc ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={requestVirtualAccount} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Set Up Bank Deposits
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>This will provide you with:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>US bank account details</li>
              <li>ACH transfer instructions</li>
              <li>Automatic USD → USDC conversion</li>
              <li>Direct deposit to your treasury</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-green-600">Active</span>
          <CreditCard className="h-3 w-3 text-emerald-600" />
        </div>
        
        <div className="space-y-2">
          {/* Account Number */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-500">Account</div>
              <div className="font-mono text-xs font-medium truncate">{virtualAccount.bankAccountNumber}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(virtualAccount.bankAccountNumber, "account")}
            >
              {copiedField === "account" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Routing Number */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-500">Routing</div>
              <div className="font-mono text-xs font-medium truncate">{virtualAccount.bankRoutingNumber}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(virtualAccount.bankRoutingNumber, "routing")}
            >
              {copiedField === "routing" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            {virtualAccount.bankName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Bank Deposit Instructions</CardTitle>
          </div>
          <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Active
          </div>
        </div>
        <CardDescription>
          Use these details to transfer USD from your bank account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Funds sent to this account will automatically convert to USDC and deposit into your treasury
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {/* Bank Name */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Bank Name</div>
              <div className="font-mono text-sm font-medium">{virtualAccount.bankName}</div>
            </div>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Account Number</div>
              <div className="font-mono text-sm font-medium">{virtualAccount.bankAccountNumber}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(virtualAccount.bankAccountNumber, "account")}
            >
              {copiedField === "account" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Routing Number */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Routing Number</div>
              <div className="font-mono text-sm font-medium">{virtualAccount.bankRoutingNumber}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(virtualAccount.bankRoutingNumber, "routing")}
            >
              {copiedField === "routing" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Beneficiary Name */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Account Holder</div>
              <div className="font-mono text-sm font-medium">{virtualAccount.bankBeneficiaryName}</div>
            </div>
          </div>
        </div>

        {/* Destination Info */}
        <div className="rounded-lg bg-muted p-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">Destination Treasury</div>
          <div className="font-mono text-xs break-all">{virtualAccount.destinationAddress}</div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">How to deposit:</p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Log in to your bank's website or app</li>
            <li>Set up a new transfer or bill payment</li>
            <li>Enter the account and routing numbers above</li>
            <li>Submit your transfer (typically 1-3 business days)</li>
            <li>Funds will automatically convert to USDC in your treasury</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
