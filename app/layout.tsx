import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { PrivyProvider } from '@privy-io/react-auth'
import { Toaster } from '@/components/ui/toaster'
import { RootLayout } from '@/components/root-layout'
import './globals.css'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://corridorfi.xyz'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Corridor - Pay Your Team. Grow Your Wealth. Automatically.',
  description: 'The only payroll platform with built-in DeFi investing. Unify global payroll and peer-to-peer transfers on a single, secure platform.',
  generator: 'corridor.app',
  icons: {
    icon: '/favicon.ico'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corridor - Pay Your Team. Grow Your Wealth. Automatically.',
    description: 'The only payroll platform with built-in DeFi investing. Unify global payroll and peer-to-peer transfers.',
    images: ['https://corridorfi.xyz/corridor-landing.png'],
    creator: '@CorridorFi',
    site: '@CorridorFi',
  },
  openGraph: {
    title: 'Corridor - Pay Your Team. Grow Your Wealth. Automatically.',
    description: 'The only payroll platform with built-in DeFi investing. Unify global payroll and peer-to-peer transfers.',
    url: baseUrl,
    siteName: 'Corridor',
    images: [
      {
        url: 'https://corridorfi.xyz/corridor-landing.png',
        width: 1200,
        height: 630,
        alt: 'Corridor - Modern Payroll Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <RootLayout>
          {children}
        </RootLayout>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
