"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSessionTimeout } from '@/lib/hooks/use-session-timeout'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isExpired, remainingTime, showWarning, handleLogout } = useSessionTimeout()
  const [showDialog, setShowDialog] = useState(false)

  // Don't show timeout on auth or landing pages
  const isAuthPage = pathname === '/auth'
  const isLandingPage = pathname === '/'
  const shouldMonitor = !isAuthPage && !isLandingPage

  useEffect(() => {
    if (!shouldMonitor) return

    if (isExpired) {
      // Session expired, show dialog and redirect
      setShowDialog(true)
    } else if (showWarning) {
      // Show warning dialog
      setShowDialog(true)
    } else {
      setShowDialog(false)
    }
  }, [isExpired, showWarning, shouldMonitor])

  const handleContinue = () => {
    if (isExpired) {
      // Redirect to auth page
      handleLogout()
    } else {
      // Just close the warning
      setShowDialog(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <>
      {children}
      
      {shouldMonitor && (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent className="max-w-md bg-white/98 backdrop-blur-xl border-0 shadow-2xl rounded-3xl p-8">
            <AlertDialogHeader className="space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isExpired 
                    ? 'bg-red-50 text-red-500' 
                    : 'bg-amber-50 text-amber-500'
                }`}>
                  {isExpired ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title */}
              <AlertDialogTitle className="text-2xl font-bold text-center text-slate-900">
                {isExpired ? 'Session Expired' : 'Session Expiring Soon'}
              </AlertDialogTitle>

              {/* Description */}
              <AlertDialogDescription className="text-center text-slate-600 text-base leading-relaxed">
                {isExpired ? (
                  <p>
                    Your session has expired for security. Please log in again to continue.
                  </p>
                ) : (
                  <p>
                    Your session will expire in{' '}
                    <span className="font-semibold text-slate-900">{formatTime(remainingTime)}</span>
                    {' '}for security.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Action Button */}
            <AlertDialogFooter className="mt-6">
              <AlertDialogAction
                onClick={handleContinue}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isExpired ? 'Log In Again' : 'Got It'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
