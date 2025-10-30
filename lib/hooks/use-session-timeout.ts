"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour in milliseconds
const CHECK_INTERVAL_MS = 60 * 1000 // Check every minute
const WARNING_THRESHOLD_MS = 5 * 60 * 1000 // Show warning 5 minutes before timeout

export interface SessionTimeoutState {
  isExpired: boolean
  remainingTime: number
  showWarning: boolean
}

export function useSessionTimeout() {
  const router = useRouter()
  const [state, setState] = useState<SessionTimeoutState>({
    isExpired: false,
    remainingTime: SESSION_TIMEOUT_MS,
    showWarning: false,
  })

  const checkSession = useCallback(async () => {
    try {
      // Call API to check session validity
      const response = await fetch('/api/session/check', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        // Session is invalid or expired
        setState({
          isExpired: true,
          remainingTime: 0,
          showWarning: false,
        })
        return
      }

      const data = await response.json()
      const remainingTime = data.remainingTime || 0

      setState({
        isExpired: remainingTime <= 0,
        remainingTime,
        showWarning: remainingTime > 0 && remainingTime <= WARNING_THRESHOLD_MS,
      })

      // If session expired, redirect to auth
      if (remainingTime <= 0) {
        await handleLogout()
      }
    } catch (error) {
      console.error('[SessionTimeout] Error checking session:', error)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('[SessionTimeout] Error during logout:', error)
    } finally {
      // Redirect to auth page
      router.push('/auth')
    }
  }, [router])

  const extendSession = useCallback(async () => {
    try {
      // Call API to refresh session
      const response = await fetch('/api/session/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Reset the timer
        setState({
          isExpired: false,
          remainingTime: SESSION_TIMEOUT_MS,
          showWarning: false,
        })
      }
    } catch (error) {
      console.error('[SessionTimeout] Error extending session:', error)
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkSession()

    // Set up interval to check session periodically
    const interval = setInterval(checkSession, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [checkSession])

  return {
    ...state,
    handleLogout,
    extendSession,
  }
}
