"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, User, Mail, DollarSign, Calendar, CheckCircle, AlertCircle, ArrowRight, Building2 } from "lucide-react"
import { format } from "date-fns"
import { isValidSolanaAddress } from "@/lib/utils/validation"

interface AddEmployeePayrollDialogProps {
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface UserLookupResult {
  id: string
  email: string
  username?: string
  publicKey?: string
  gridUserId?: string
  kycStatus?: string
}

export function AddEmployeePayrollDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: AddEmployeePayrollDialogProps) {
  const [step, setStep] = useState<'email' | 'details' | 'confirm'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addressValid, setAddressValid] = useState<boolean | null>(null)
  const [addressVerified, setAddressVerified] = useState(false)
  
  // Form data
  const [email, setEmail] = useState('')
  const [publicAddress, setPublicAddress] = useState('')
  const [lookupType, setLookupType] = useState<'email' | 'address'>('email')
  const [userDetails, setUserDetails] = useState<UserLookupResult | null>(null)
  const [isDirectAddress, setIsDirectAddress] = useState(false)
  const [amountPerPayment, setAmountPerPayment] = useState('')
  const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleLookup = async () => {
    const lookupValue = lookupType === 'email' ? email : publicAddress
    
    if (!lookupValue) {
      setError(`Please enter ${lookupType === 'email' ? 'an email address' : 'a public address'}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      // If it's an address lookup, validate the Solana address format
      if (lookupType === 'address') {
        if (!isValidSolanaAddress(lookupValue)) {
          setAddressValid(false)
          throw new Error('Invalid Solana address format')
        }

        setAddressValid(true)
        setAddressVerified(false)

        // Try to lookup user by address, but allow direct address if not found
        try {
          const queryParam = 'publicAddress'
          const response = await fetch(`/api/users?${queryParam}=${encodeURIComponent(lookupValue)}`)
          const data = await response.json()

          if (data.success && data.user) {
            // User found - use their details
            setUserDetails(data.user)
            setIsDirectAddress(false)
            setAddressVerified(true)
          } else {
            // User not found - create a temporary user detail object for direct address
            setUserDetails({
              id: '',
              email: '',
              username: lookupValue.slice(0, 8) + '...' + lookupValue.slice(-8),
              publicKey: lookupValue,
              gridUserId: '',
            })
            setIsDirectAddress(true)
            setAddressVerified(true)
          }
        } catch (err) {
          // Even if lookup fails, allow direct address payment
          setUserDetails({
            id: '',
            email: '',
            username: lookupValue.slice(0, 8) + '...' + lookupValue.slice(-8),
            publicKey: lookupValue,
            gridUserId: '',
          })
          setIsDirectAddress(true)
          setAddressVerified(true)
        }
        
        setStep('details')
      } else {
        // Email lookup - require user to be onboarded
        const queryParam = 'email'
        const response = await fetch(`/api/users?${queryParam}=${encodeURIComponent(lookupValue)}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to lookup user')
        }

        if (!data.user) {
          throw new Error('User not found. Employee must be onboarded to the platform first.')
        }

        if (!data.user.gridUserId) {
          throw new Error('User does not have a Grid account. Please complete onboarding first.')
        }

        if (!data.user.publicKey) {
          throw new Error('User does not have a public key. Please complete wallet setup first.')
        }

        setUserDetails(data.user)
        setStep('details')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayroll = async () => {
    // Validate all required fields
    if (!userDetails) {
      setError('User details not found. Please lookup the employee again.')
      return
    }
    
    if (!userDetails.email && !userDetails.publicKey) {
      setError('Employee must have either email or public key')
      return
    }
    
    if (!amountPerPayment || amountPerPayment.trim() === '') {
      setError('Amount per payment is required')
      return
    }
    
    const amountValue = parseFloat(amountPerPayment)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    
    if (!cadence) {
      setError('Payment frequency is required')
      return
    }
    
    if (!startDate) {
      setError('Start date is required')
      return
    }

    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      
      if (cadence === 'weekly' && daysDiff < 7) {
        setError(`For weekly payroll, end date must be at least 7 days after start date. Please choose a later end date.`)
        return
      }
      
      if (cadence === 'monthly' && daysDiff < 30) {
        setError(`For monthly payroll, end date must be at least 30 days after start date. Please choose a later end date.`)
        return
      }
    }

    setLoading(true)
    setError('')

    // Construct payload with all required fields
    // If user has email, use email lookup; otherwise use direct address
    const isDirectAddress = !userDetails.email || !userDetails.gridUserId;
    
    const payload: any = {
      amountPerPayment: amountValue,
      cadence,
      startDate,
      ...(endDate && { endDate }),
    }

    if (isDirectAddress && userDetails.publicKey) {
      // Direct address payment (no user lookup required)
      payload.directAddress = userDetails.publicKey
    } else {
      // Email-based payment (user must be onboarded)
      payload.employeeEmail = userDetails.email
    }

    console.log('[AddEmployeeDialog] Submitting payroll with payload:', payload)
    console.log('[AddEmployeeDialog] Is direct address:', isDirectAddress)

    try {
      const response = await fetch(`/api/organization/${organizationId}/payroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payroll stream')
      }

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('email')
    setEmail('')
    setPublicAddress('')
    setLookupType('email')
    setUserDetails(null)
    setIsDirectAddress(false)
    setAmountPerPayment('')
    setCadence('monthly')
    setStartDate('')
    setEndDate('')
    setError('')
    setAddressValid(null)
    setAddressVerified(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetForm, 300) // Reset after dialog closes
  }

  const getCadenceLabel = (cadence: string) => {
    switch (cadence) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return cadence
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white/95 to-slate-50/95 border-slate-200/50 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-sky-100 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">Add Employee to Payroll</div>
              <div className="text-sm font-medium bg-gradient-to-r from-slate-600 to-sky-500 bg-clip-text text-transparent">
                Corridor
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Add an employee to your organization's automated payroll system with streaming payments.
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Step {step === 'email' ? 1 : step === 'details' ? 2 : 3} of 3</span>
              <span>{step === 'email' ? 'Find Employee' : step === 'details' ? 'Configure Payroll' : 'Confirm Details'}</span>
            </div>
            <Progress 
              value={step === 'email' ? 33 : step === 'details' ? 66 : 100} 
              className="h-2 bg-slate-100"
            />
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'email' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50/80 to-sky-50/80 rounded-xl border border-blue-200/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Find Employee</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Enter either the email address (requires user to be onboarded) or a Solana public address (allows direct payments to any address).
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Lookup Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setLookupType('email')
                    setPublicAddress('')
                    setAddressValid(null)
                    setAddressVerified(false)
                    setError('')
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    lookupType === 'email'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLookupType('address')
                    setEmail('')
                    setAddressValid(null)
                    setAddressVerified(false)
                    setError('')
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    lookupType === 'address'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Address
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={lookupType === 'email' ? 'email' : 'publicAddress'} className="text-sm font-medium text-slate-700">
                  {lookupType === 'email' ? 'Employee Email Address' : 'Employee Public Address'}
                </Label>
                <div className="relative">
                  {lookupType === 'email' ? (
                    <>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="employee@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && email && handleLookup()}
                        className="pl-10 h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                      />
                    </>
                  ) : (
                    <>
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        id="publicAddress"
                        type="text"
                        placeholder="Public Address (e.g., 5KJt...)"
                        value={publicAddress}
                        onChange={(e) => {
                          setPublicAddress(e.target.value)
                          setError('')
                          // Real-time validation
                          if (e.target.value.trim() === '') {
                            setAddressValid(null)
                          } else {
                            setAddressValid(isValidSolanaAddress(e.target.value.trim()))
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && publicAddress && addressValid !== false && handleLookup()}
                        className={`pl-10 pr-10 h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500 font-mono text-sm ${
                          addressValid === false ? 'border-red-300 focus:border-red-500' : 
                          addressValid === true ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                      />
                      {addressValid === true && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 z-10" />
                      )}
                      {addressValid === false && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 z-10" />
                      )}
                    </>
                  )}
                </div>
                {lookupType === 'email' && email && !loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Ready to lookup employee
                  </p>
                )}
                {lookupType === 'address' && publicAddress && !loading && (
                  <>
                    {addressValid === true && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Valid Solana address - Click Verify to continue
                      </p>
                    )}
                    {addressValid === false && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Invalid Solana address format
                      </p>
                    )}
                    {addressValid === null && publicAddress && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        Enter a valid Solana address
                      </p>
                    )}
                  </>
                )}
                {loading && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {lookupType === 'address' ? 'Verifying address...' : 'Looking up employee...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'details' && userDetails && (
          <div className="space-y-6">
            {/* User Details */}
            {!isDirectAddress ? (
              /* Employee Found - Minimal Display */
              <div className="p-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-lg">
                        {userDetails.username || userDetails.email}
                      </p>
                      {userDetails.email && (
                        <p className="text-sm text-slate-600 mt-0.5">{userDetails.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Corridor Account - Verified</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Direct Address - Full Display */
              <div className="p-6 bg-gradient-to-r from-blue-50/80 to-sky-50/80 rounded-xl border border-blue-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Email Verified</h3>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md">
                    Direct Address
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Username</p>
                    <p className="font-medium text-slate-900">
                      {userDetails.username || userDetails.email || 'N/A'}
                    </p>
                  </div>
                  {userDetails.publicKey && (
                    <div>
                      <p className="text-slate-600 mb-1">Wallet Address</p>
                      <p className="font-medium text-slate-900 font-mono text-xs break-all">
                        {userDetails.publicKey}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payroll Configuration */}
            <div className="p-6 bg-gradient-to-r from-slate-50/80 to-blue-50/80 rounded-xl border border-slate-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-sky-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Configure Payroll</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                    {cadence === 'weekly' ? 'Amount per Week (USDC)' : 'Amount per Month (USDC)'}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.10"
                      placeholder={cadence === 'weekly' ? '7.00' : '30.00'}
                      value={amountPerPayment}
                      onChange={(e) => setAmountPerPayment(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {cadence === 'weekly' ? (
                      <span>Monthly equivalent: ~${(parseFloat(amountPerPayment || '0') * 4.33).toFixed(2)}</span>
                    ) : (
                      <span>Monthly salary amount</span>
                    )}
                  </div>
                  {amountPerPayment && parseFloat(amountPerPayment) < 0.10 && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Minimum amount is $0.10 USDC
                    </p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="cadence" className="text-sm font-medium text-slate-700">
                    Payment Frequency
                  </Label>
                  <Select value={cadence} onValueChange={(value: any) => setCadence(value)}>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-slate-500">
                    {cadence === 'weekly' ? 'Payments every week' : 'Payments every month'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                    Start Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    When payroll should begin
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                    End Date (Optional)
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {cadence === 'weekly' 
                      ? 'Must be at least 7 days after start date. Leave empty for 4 weeks duration' 
                      : 'Must be at least 30 days after start date. Leave empty for 3 months duration'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && userDetails && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50/80 to-sky-50/80 rounded-xl border border-blue-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Confirm Payroll Details</h3>
              </div>
              
              {/* Employee Information - Minimal */}
              {!isDirectAddress ? (
                <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{userDetails.username || userDetails.email}</p>
                        {userDetails.email && (
                          <p className="text-sm text-slate-600">{userDetails.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Corridor Account - Verified</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{userDetails.username || 'Direct Address'}</p>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md">
                      Direct Address
                    </span>
                  </div>
                  {userDetails.publicKey && (
                    <p className="text-xs text-slate-600 font-mono break-all">{userDetails.publicKey}</p>
                  )}
                </div>
              )}
              
              {/* Payroll Configuration */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 text-sm mb-3">Payroll Configuration</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-medium text-slate-900">${amountPerPayment} USDC {getCadenceLabel(cadence)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">Start Date:</span>
                    <span className="font-medium text-slate-900">{format(new Date(startDate), 'PPP')}</span>
                  </div>
                  {endDate && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">End Date:</span>
                      <span className="font-medium text-slate-900">{format(new Date(endDate), 'PPP')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-50/50 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>Note:</strong> Once created, this payroll stream will run automatically and cannot be paused or stopped. 
                  Payments will be processed according to the schedule you've configured.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-6 border-t border-slate-200/50">
          {step === 'email' && (
            <>
              <Button variant="outline" onClick={handleClose} className="border-slate-200 hover:bg-slate-50">
                Cancel
              </Button>
              <Button 
                onClick={handleLookup} 
                disabled={loading || (lookupType === 'email' ? !email : !publicAddress || addressValid === false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {lookupType === 'address' ? 'Verifying...' : 'Looking up...'}
                  </>
                ) : lookupType === 'address' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Address
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Lookup Employee
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'details' && (
            <>
              <Button variant="outline" onClick={() => setStep('email')} className="border-slate-200 hover:bg-slate-50">
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm')} 
                disabled={!amountPerPayment || !startDate || parseFloat(amountPerPayment) < 0.10}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('details')} className="border-slate-200 hover:bg-slate-50">
                Back
              </Button>
              <Button 
                onClick={handleCreatePayroll} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Create Payroll Stream
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

