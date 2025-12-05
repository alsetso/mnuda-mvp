import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/features/ui/components/Toast'
import { Providers } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import LocalStorageCleanup from '@/components/LocalStorageCleanup'
// Removed usage/billing context and modals after simplifying app
// Footer moved to PageLayout component for consistent page structure

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mnuda.com'),
  title: 'MNUDA - Minnesota Platform for Under Development & Acquisition | Real Estate Network',
  description: "MNUDA connects real estate professionals in Minnesota. Discover development opportunities, property acquisitions, and network with developers, investors, and service providers across the state.",
  keywords: 'Minnesota real estate development, property acquisition Minnesota, real estate network Minnesota, development opportunities Minnesota, property investment Minnesota, real estate professionals Minnesota, Minnesota developers, real estate connections Minnesota, property development Minnesota, Minnesota real estate platform',
  authors: [{ name: 'MNUDA' }],
  creator: 'MNUDA',
  publisher: 'MNUDA',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/fav.png', type: 'image/png' },
    ],
    shortcut: [{ url: '/fav.png', type: 'image/png' }],
    apple: [{ url: '/fav.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'MNUDA - Minnesota Platform for Under Development & Acquisition | Real Estate Network',
    description: "MNUDA connects real estate professionals in Minnesota. Discover development opportunities, property acquisitions, and network with developers, investors, and service providers across the state.",
    url: 'https://mnuda.com',
    siteName: 'MNUDA',
    images: [
      {
        url: '/MN.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'MNUDA - For the Love of Minnesota',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MNUDA - Minnesota Platform for Under Development & Acquisition',
    description: "MNUDA connects real estate professionals in Minnesota. Discover development opportunities, property acquisitions, and network with developers, investors, and service providers.",
    images: ['/MN.png'],
    creator: '@mnuda',
  },
  alternates: {
    canonical: 'https://mnuda.com',
  },
  category: 'Project Management & Real Estate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="min-h-screen w-full" style={{ display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <ErrorBoundary>
            <LocalStorageCleanup />
            {/* Pages handle their own header/footer via PageLayout component */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
            <ToastContainer />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
