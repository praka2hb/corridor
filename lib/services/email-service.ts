import { Resend } from 'resend'
import OrganizationInvitation from '@/emails/organization-invitation'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendInvitationParams {
  email: string
  organizationName: string
  inviterName: string
  token: string
  role: string
  position?: string
}

export async function sendOrganizationInvitation({
  email,
  organizationName,
  inviterName,
  token,
  role,
  position,
}: SendInvitationParams) {
  const acceptLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Corridor <noreply@corridorfi.xyz>',
      to: [email],
      subject: `You're invited to join ${organizationName}`,
      react: OrganizationInvitation({
        organizationName,
        inviterName,
        acceptLink,
        role,
        position,
      }),
    })

    if (error) {
      console.error('[Email Service] Error sending invitation:', error)
      throw new Error(`Failed to send invitation: ${error.message}`)
    }

    console.log('[Email Service] Invitation sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('[Email Service] Exception sending invitation:', error)
    throw error
  }
}
