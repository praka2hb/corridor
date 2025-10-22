"use client"

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CheckCircle, Shield, Sparkles, XCircle } from 'lucide-react'

type OTPStatus = 'idle' | 'verifying' | 'success' | 'error'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStatus, setOtpStatus] = useState<OTPStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authFlow, setAuthFlow] = useState<'signup' | 'login'>('signup')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameLoading, setUsernameLoading] = useState(false)

  async function startAuth(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to start authentication. Please try again.')
      
      // Store auth flow for context
      setAuthFlow(data.authFlow || 'signup')
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = useCallback(async () => {
    setError(null)
    if (otp.length !== 6 || !email) return
    
    setOtpStatus('verifying')
    setLoading(true)
    
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otp, 
          user: { 
            email,
            signers: []
          } 
        }),
      })
      const data = await res.json()
      
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Incorrect OTP code. Please check and try again.')
      }
      
      // Check if user has username
      const userDataRes = await fetch('/api/user-data')
      const userData = await userDataRes.json()
      
      if (userData.success && userData.user) {
        if (!userData.user.username) {
          // Show username modal only if username is not set
          setShowUsernameModal(true)
        } else {
          // User already has username, redirect directly to home
          router.push('/home')
        }
      } else {
        // If no user data, redirect to home anyway
        router.push('/home')
      }
    } catch (err: any) {
      setOtpStatus('error')
      setError(err.message || 'Incorrect OTP code. Please try again.')
      
      // Auto-clear OTP after showing error
      setTimeout(() => {
        setOtp('')
        setOtpStatus('idle')
        setError(null)
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, [otp, email, router])

  // Auto-submit OTP when 6 digits are entered
  useEffect(() => {
    console.log('[Auth] OTP changed:', { length: otp.length, status: otpStatus, hasEmail: !!email })
    if (otp.length === 6 && otpStatus === 'idle' && email) {
      console.log('[Auth] Auto-submitting OTP...')
      verifyOtp()
    }
  }, [otp, otpStatus, email, verifyOtp])

  async function handleSetUsername(e: React.FormEvent) {
    e.preventDefault()
    setUsernameError(null)
    
    if (!username || username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters long.')
      return
    }
    
    setUsernameLoading(true)
    try {
      const res = await fetch('/api/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const data = await res.json()
      
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Username is already taken or invalid. Please try another! 💫')
      }
      
      // Close modal and redirect
      setShowUsernameModal(false)
      setTimeout(() => router.push('/home'), 300)
    } catch (err: any) {
      setUsernameError(err.message || 'Failed to set username. Please try again.')
    } finally {
      setUsernameLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Dotted Background Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        <div className="w-full max-w-md space-y-12 relative z-10">
          {/* Logo */}
          <div className="flex justify-center">
            <Image 
              src="/corridor.png" 
              alt="Corridor" 
              width={72} 
              height={72} 
              className="rounded-2xl"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <p className="text-slate-600 text-lg">
                {step === 'email' 
                  ? '' 
                  : step === 'otp' 
                  ? `We sent a code to ${email}` 
                  : 'Authentication successful'}
              </p>
            </div>

            {/* Email Step */}
            {step === 'email' && (
              <form onSubmit={startAuth} className="space-y-10">
                <div className="flex justify-center">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full max-w-sm h-14 text-base text-center rounded-2xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:shadow-xl transition-all duration-200 placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <div className="flex justify-center">
                    <div className="max-w-sm w-full bg-red-50/80 backdrop-blur-sm text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="group relative flex items-center gap-3 px-8 py-4 text-base font-semibold text-slate-900 disabled:text-slate-400 transition-all duration-300 hover:scale-110 hover:text-blue-600 disabled:hover:scale-100 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <svg 
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={6} 
                      value={otp} 
                      onChange={(value) => {
                        setOtp(value)
                        if (otpStatus === 'error') {
                          setOtpStatus('idle')
                          setError(null)
                        }
                      }}
                      disabled={loading}
                    >
                      <InputOTPGroup className="gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot 
                            key={i} 
                            index={i}
                            className={cn(
                              "w-14 h-16 text-xl font-bold rounded-2xl border-2 transition-all duration-300",
                              otpStatus === 'idle' && "bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl",
                              otpStatus === 'verifying' && "bg-blue-50/80 backdrop-blur-sm border-blue-300 shadow-blue-200 animate-pulse",
                              otpStatus === 'success' && "bg-green-50/80 backdrop-blur-sm border-green-400 text-green-700 shadow-green-200",
                              otpStatus === 'error' && "bg-red-50/80 backdrop-blur-sm border-red-400 text-red-700 shadow-red-200 animate-shake"
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  {/* Status Message */}
                  <div className="flex items-center justify-center gap-2 min-h-[24px]">
                    {otpStatus === 'idle' && (
                      <p className="text-sm text-slate-500 text-center">
                        Enter the 6-digit code
                      </p>
                    )}
                    {otpStatus === 'verifying' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm font-medium">Verifying...</p>
                      </div>
                    )}
                    {otpStatus === 'success' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Verified successfully!</p>
                      </div>
                    )}
                    {otpStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Wrong OTP</p>
                      </div>
                    )}
                  </div>
                </div>

                {error && otpStatus === 'error' && (
                  <div className="flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="max-w-sm w-full bg-red-50/80 backdrop-blur-sm text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2 border border-red-200">
                      <span className="text-lg">⚠️</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('email')
                      setOtp('')
                      setOtpStatus('idle')
                      setError(null)
                    }}
                    disabled={loading}
                    className="text-slate-600 hover:text-slate-900 hover:bg-transparent"
                  >
                    Change email address
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {step === 'email' && (
            <div className="flex justify-center">
              <div className="max-w-sm text-center">
                <div className="flex items-center justify-center gap-2 text-slate-600">
                  <Shield className="h-4 w-4" />
                  <p className="text-sm">
                    Passwordless authentication. No passwords to remember.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Username Modal */}
      <Dialog open={showUsernameModal} onOpenChange={(open) => !usernameLoading && setShowUsernameModal(open)}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader className="space-y-6">
            <div className="flex justify-center">
              <Image 
                src="/corridor.png" 
                alt="Corridor" 
                width={72} 
                height={72} 
                className="rounded-2xl"
              />
            </div>
            <DialogTitle className="text-3xl font-bold text-center text-slate-900">
              Choose Your Username
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-base">
              This will be your unique identifier on Corridor
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSetUsername} className="space-y-6 mt-6">
            <div className="space-y-3">
              <div className="relative flex justify-center">
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg pointer-events-none" style={{ left: 'calc(50% - 110px)' }}>@</span>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setUsernameError(null)
                  }}
                  required
                  disabled={usernameLoading}
                  className="w-full max-w-sm h-14 text-base text-center rounded-2xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:shadow-xl transition-all duration-200 placeholder:text-slate-400"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_-]+"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                3-20 characters • letters, numbers, underscores, or hyphens
              </p>
            </div>

            {usernameError && (
              <div className="flex justify-center">
                <div className="max-w-sm w-full bg-red-50/80 backdrop-blur-sm text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{usernameError}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={usernameLoading || !username || username.trim().length < 3}
                className="group relative flex items-center gap-3 px-8 py-4 text-base font-semibold text-slate-900 disabled:text-slate-400 transition-all duration-300 hover:scale-110 hover:text-blue-600 disabled:hover:scale-100 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
              >
                {usernameLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Setting username...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <svg 
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


