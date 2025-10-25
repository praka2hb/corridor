"use client"

import Image from "next/image"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserData } from "@/hooks/use-user-data"

export function AppBar() {
  const { userData } = useUserData()
  
  // Get user's initial(s) - first letter of username or email
  const getUserInitials = () => {
    if (userData?.username) {
      return userData.username.charAt(0).toUpperCase()
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <Image
            src="/corridor.png"
            alt="Corridor"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Corridor</h1>
            <p className="text-xs text-slate-500">Payroll & Payments</p>
          </div>
        </div>

        {/* Right Side: Notification + Avatar */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#0f44e1]"></span>
          </Button>

          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatar.jpg" />
            <AvatarFallback className="bg-gradient-to-br from-[#0f44e1] to-[#174ef0] text-xs font-medium text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
