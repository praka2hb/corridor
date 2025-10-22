"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Trash2, AlertCircle, Loader2, Clock, CheckCircle } from "lucide-react"

interface ManageSignersDialogProps {
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
  currentUserRole: string
}

interface Signer {
  id: string
  role: string
  user: {
    id: string
    email: string
    username?: string
    publicKey?: string
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
}

export function ManageSignersDialog({
  organizationId,
  open,
  onOpenChange,
  onUpdate,
  currentUserRole
}: ManageSignersDialogProps) {
  const [signers, setSigners] = useState<Signer[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Fetch signers and invitations when dialog opens
  useEffect(() => {
    if (open) {
      fetchSigners()
      fetchInvitations()
    }
  }, [open, organizationId])

  const fetchSigners = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organization/${organizationId}/members`)
      const data = await response.json()

      if (data.success) {
        setSigners(data.members)
      } else {
        setError(data.error || 'Failed to load signers')
      }
    } catch (err: any) {
      console.error('Failed to fetch signers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/invitations`)
      const data = await response.json()

      if (data.success) {
        setInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    }
  }

  const handleUpdateRole = async (signerId: string, newRole: string) => {
    try {
      setUpdatingId(signerId)
      setError("")

      const response = await fetch(`/api/organization/${organizationId}/members/${signerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update role')
      }

      // Update local state
      setSigners(signers.map(s => 
        s.id === signerId ? { ...s, role: newRole } : s
      ))
      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveSigner = async (signerId: string) => {
    if (!confirm('Are you sure you want to remove this signer?')) {
      return
    }

    try {
      setUpdatingId(signerId)
      setError("")

      const response = await fetch(`/api/organization/${organizationId}/members/${signerId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove signer')
      }

      // Update local state
      setSigners(signers.filter(s => s.id !== signerId))
      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      setUpdatingId(invitationId)
      setError("")

      const response = await fetch(`/api/organization/${organizationId}/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      // Update local state
      setInvitations(invitations.filter(i => i.id !== invitationId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Signers</DialogTitle>
          <DialogDescription>
            Add, remove, or update roles for organization signers
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Signers ({signers.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({invitations.filter(i => i.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="flex-1 overflow-auto space-y-3 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : signers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No signers yet</p>
              </div>
            ) : (
              signers.map((signer) => (
                <div
                  key={signer.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-sky-100 text-sky-700 text-sm">
                        {getInitials(signer.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {signer.user.email}
                      </p>
                      {signer.user.publicKey && (
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {signer.user.publicKey.slice(0, 8)}...{signer.user.publicKey.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && signer.role !== 'owner' ? (
                      <>
                        <Select
                          value={signer.role}
                          onValueChange={(value) => handleUpdateRole(signer.id, value)}
                          disabled={updatingId === signer.id}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveSigner(signer.id)}
                          disabled={updatingId === signer.id}
                        >
                          {updatingId === signer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <Badge className={getRoleBadgeColor(signer.role)}>
                        {signer.role}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="flex-1 overflow-auto space-y-3 mt-4">
            {invitations.filter(i => i.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No pending invitations</p>
              </div>
            ) : (
              invitations
                .filter(i => i.status === 'pending')
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {invitation.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {invitation.role}
                      </Badge>
                      {canManage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={updatingId === invitation.id}
                        >
                          {updatingId === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canManage && (
            <Button onClick={() => {
              onOpenChange(false)
              // You can add logic to open the add signer dialog here
              setTimeout(() => {
                const addButton = document.querySelector('[data-add-signer-trigger]') as HTMLButtonElement
                addButton?.click()
              }, 100)
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Signer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
