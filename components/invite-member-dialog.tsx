"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Mail, UserPlus } from "lucide-react"

interface InviteMemberDialogProps {
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InviteMemberDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [position, setPosition] = useState("")
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const handleEmailBlur = async () => {
    if (!email || email === foundUser?.email) return

    try {
      setSearching(true)
      setMessage(null)
      setFoundUser(null)

      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success && data.found) {
        setFoundUser(data.user)
        setMessage({
          type: 'info',
          text: `Found registered user: ${data.user.username || data.user.email}`,
        })
      } else {
        setMessage({
          type: 'info',
          text: 'User not registered. An invitation email will be sent.',
        })
      }
    } catch (error) {
      console.error('Error searching for user:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async () => {
    try {
      setInviting(true)
      setMessage(null)

      const response = await fetch(`/api/organization/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          position: position || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member')
      }

      if (data.type === 'existing_user') {
        setMessage({
          type: 'success',
          text: '✅ User added to organization successfully!',
        })
      } else if (data.type === 'invitation_sent') {
        setMessage({
          type: 'success',
          text: '✅ Invitation sent! They will receive an email to join.',
        })
      }

      // Reset form after success
      setTimeout(() => {
        setEmail("")
        setRole("member")
        setPosition("")
        setFoundUser(null)
        setMessage(null)
        onOpenChange(false)
        onSuccess?.()
      }, 2000)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to invite member',
      })
    } finally {
      setInviting(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setRole("member")
    setPosition("")
    setFoundUser(null)
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Add an existing user or send an invitation email to join your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              disabled={inviting}
            />
            {searching && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </p>
            )}
          </div>

          {/* User Info */}
          {foundUser && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{foundUser.username || foundUser.email}</strong>
                {foundUser.publicKey && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {foundUser.publicKey.slice(0, 8)}...{foundUser.publicKey.slice(-8)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={inviting}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'owner' && 'Full control over organization'}
              {role === 'admin' && 'Can manage members and settings'}
              {role === 'member' && 'Basic organization access'}
            </p>
          </div>

          {/* Position Input */}
          <div className="space-y-2">
            <Label htmlFor="position">Position (Optional)</Label>
            <Input
              id="position"
              type="text"
              placeholder="e.g., CFO, Manager, Accountant"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={inviting}
            />
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={inviting}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!email || inviting}>
            {inviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {foundUser ? 'Adding...' : 'Sending...'}
              </>
            ) : (
              <>
                {foundUser ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add to Organization
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
