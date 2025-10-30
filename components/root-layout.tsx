"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ModernSidebar } from "@/components/modern-sidebar"
import { AppBar } from "@/components/app-bar"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
import { cn } from "@/lib/utils"

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Don't show sidebar/appbar on auth page or landing page
  const isAuthPage = pathname === '/auth'
  const isLandingPage = pathname === '/'
  
  if (isAuthPage || isLandingPage) {
    return (
      <SessionTimeoutProvider>
        {children}
      </SessionTimeoutProvider>
    )
  }

  return (
    <SessionTimeoutProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
        {/* Dotted Background Pattern */}
        <div 
          className="fixed inset-0 opacity-20 pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* App Bar */}
        <AppBar />

        {/* Modern Sidebar */}
        <ModernSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className={cn(
          "min-h-screen pt-20 px-6 pb-6 transition-all duration-300 relative z-10",
          sidebarCollapsed ? "ml-16" : "ml-72"
        )}>
          {children}
        </main>
      </div>
    </SessionTimeoutProvider>
  )
}
