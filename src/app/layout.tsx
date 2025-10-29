import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/features/ui/contexts/ToastContext'
import { ToastContainer } from '@/features/ui/components/Toast'
import { AuthProvider } from '@/features/auth'
import { WorkspaceProvider } from '@/features/workspaces'
// Removed usage/billing context and modals after simplifying app
// Footer moved to PageLayout component for consistent page structure

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mnuda.com'),
  title: 'Minnesota Skip Trace Tool - Free People & Property Search | MNUDA',
  description: 'Free Minnesota skip tracing tool to find people, properties, and data instantly. No sign-up required. Professional skip tracing capabilities for everyone. Search Minneapolis, Saint Paul, Rochester, Duluth and all Minnesota cities.',
  keywords: 'Minnesota skip trace, find people Minnesota, property search Minnesota, skip tracing free, Minnesota people search, property records Minnesota, address lookup Minnesota, phone number search Minnesota',
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
    title: 'Minnesota Skip Trace Tool - Free People & Property Search',
    description: 'Free Minnesota skip tracing tool to find people, properties, and data instantly. No sign-up required. Professional skip tracing capabilities for everyone.',
    url: 'https://mnuda.com',
    siteName: 'MNUDA',
    images: [
      {
        url: '/MN.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Minnesota Skip Trace Tool - Free People & Property Search',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minnesota Skip Trace Tool - Free People & Property Search',
    description: 'Free Minnesota skip tracing tool to find people, properties, and data instantly. No sign-up required.',
    images: ['/MN.png'],
    creator: '@mnuda',
  },
  alternates: {
    canonical: 'https://mnuda.com',
  },
  category: 'Technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full w-full" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <body className="h-full w-full" style={{ margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>
          <WorkspaceProvider>
            <ToastProvider>
              {/* Pages handle their own header/footer via PageLayout component */}
              <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
                {children}
              </div>
              <ToastContainer />
            </ToastProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
