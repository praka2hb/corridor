import { Resend } from 'resend'
import OrganizationInvitation from '@/emails/organization-invitation'
import PayrollCreatedNotification from '@/emails/payroll-created-notification'
import PaymentExecutedNotification from '@/emails/payment-executed-notification'

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

export interface SendPayrollCreatedEmailParams {
  email: string
  employeeName: string
  organizationName: string
  amount: number
  frequency: string
  startDate: string
}

export async function sendPayrollCreatedEmail({
  email,
  employeeName,
  organizationName,
  amount,
  frequency,
  startDate,
}: SendPayrollCreatedEmailParams) {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/payroll/employee`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Corridor <noreply@corridorfi.xyz>',
      to: [email],
      subject: `You've been added to ${organizationName}'s payroll`,
      react: PayrollCreatedNotification({
        employeeName,
        organizationName,
        amount,
        frequency,
        startDate,
        dashboardLink,
      }),
    })

    if (error) {
      console.error('[Email Service] Error sending payroll created email:', error)
      throw new Error(`Failed to send payroll created email: ${error.message}`)
    }

    console.log('[Email Service] Payroll created email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('[Email Service] Exception sending payroll created email:', error)
    throw error
  }
}

export interface SendPaymentExecutedEmailParams {
  email: string
  employeeName: string
  organizationName: string
  amount: number
  paymentDate: string
  nextPaymentDate?: string
}

export async function sendPaymentExecutedEmail({
  email,
  employeeName,
  organizationName,
  amount,
  paymentDate,
  nextPaymentDate,
}: SendPaymentExecutedEmailParams) {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/payroll/employee`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Corridor <noreply@corridorfi.xyz>',
      to: [email],
      subject: `Payment received from ${organizationName}`,
      react: PaymentExecutedNotification({
        employeeName,
        organizationName,
        amount,
        paymentDate,
        nextPaymentDate,
        dashboardLink,
      }),
    })

    if (error) {
      console.error('[Email Service] Error sending payment executed email:', error)
      throw new Error(`Failed to send payment executed email: ${error.message}`)
    }

    console.log('[Email Service] Payment executed email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('[Email Service] Exception sending payment executed email:', error)
    throw error
  }
}