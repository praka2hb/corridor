"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, Crown, User, MoreVertical, Trash2, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Member {
  id: string
  userId: string
  role: string
  position: string | null
  canManageTreasury: boolean
  joinedAt: string
  user: {
    email: string
    username: string | null
    publicKey: string | null
  }
}

interface MemberListProps {
  organizationId: string
  members: Member[]
  currentUserRole: string
  onUpdate: () => void
}

export function MemberList({
  organizationId,
  members,
  currentUserRole,
  onUpdate,
}: MemberListProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'
  const canChangeRoles = currentUserRole === 'owner'

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setUpdating(memberId)
      
      const response = await fetch(
        `/api/organization/${organizationId}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      onUpdate()
    } catch (error: any) {
      alert(error.message || 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return

    try {
      const response = await fetch(
        `/api/organization/${organizationId}/members/${memberToDelete.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      onUpdate()
      setMemberToDelete(null)
    } catch (error: any) {
      alert(error.message || 'Failed to remove member')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInitials = (email: string, username: string | null) => {
    if (username) {
      return username.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(member.user.email, member.user.username)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {member.user.username || member.user.email}
                      </p>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(member.role)}
                      >
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                      {member.position && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground">
                            {member.position}
                          </p>
                        </>
                      )}
                    </div>
                    {member.user.publicKey && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {member.user.publicKey.slice(0, 8)}...
                        {member.user.publicKey.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    {canChangeRoles && (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                        disabled={updating === member.id}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setMemberToDelete(member)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members yet. Invite someone to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{memberToDelete?.user.username || memberToDelete?.user.email}</strong>{' '}
              from this organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
