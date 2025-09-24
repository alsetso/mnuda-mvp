import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { ToastContainer } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'MNUDA - Property Address Lookup',
  description: 'Find property information by address',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}
