import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/features/ui/contexts/ToastContext'
import { ToastContainer } from '@/features/ui/components/Toast'
import Footer from '@/features/ui/components/Footer'

export const metadata: Metadata = {
  title: 'MNUDA - Property Address Lookup',
  description: 'Find property information by address',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}
