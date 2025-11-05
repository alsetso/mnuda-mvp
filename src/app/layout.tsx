import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/features/ui/components/Toast'
import { Providers } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
// Removed usage/billing context and modals after simplifying app
// Footer moved to PageLayout component for consistent page structure

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mnuda.com'),
  title: 'MNUDA - Minnesota Under Distress and Acquisition | Distressed Property Solutions',
  description: "Minnesota's first organized network of real estate investors, professionals, and developers working together to identify, acquire, and redevelop high-value opportunities.",
  keywords: 'Minnesota distressed properties, foreclosure prevention Minnesota, probate property Minnesota, right of redemption Minnesota, subject-to Minnesota, distressed property acquisition, Minnesota real estate investors, foreclosure alternatives Minnesota, probate real estate Minnesota, tax default Minnesota, code violations Minnesota, vacant property Minnesota, short sale Minnesota, off-market properties Minnesota, assignment sales Minnesota, Hennepin County distressed property, Ramsey County foreclosure, Anoka County probate, Dakota County real estate, Wright County property, Twin Cities distressed property, Minnesota property rights, ethical property acquisition Minnesota',
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
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/favicon.svg' }],
  },
  openGraph: {
    title: 'MNUDA - Minnesota Under Distress and Acquisition | Distressed Property Solutions',
    description: "Minnesota's first organized network of real estate investors, professionals, and developers working together to identify, acquire, and redevelop high-value opportunities.",
    url: 'https://mnuda.com',
    siteName: 'MNUDA',
    images: [
      {
        url: '/MN.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'MNUDA - Minnesota Under Distress and Acquisition',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MNUDA - Minnesota Under Distress and Acquisition',
    description: "Minnesota's first organized network of real estate investors, professionals, and developers working together to identify, acquire, and redevelop high-value opportunities.",
    images: ['/MN.png'],
    creator: '@mnuda',
  },
  alternates: {
    canonical: 'https://mnuda.com',
  },
  category: 'Real Estate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="min-h-screen w-full" style={{ display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary>
          <Providers>
              {/* Pages handle their own header/footer via PageLayout component */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
              <ToastContainer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
