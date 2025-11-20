import type { NextConfig } from "next";

// Extract Supabase hostname from environment variable
const getSupabaseHostname = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    return url.hostname;
  } catch {
    return null;
  }
};

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos.zillowstatic.com',
        port: '',
        pathname: '/fp/**',
      },
      {
        protocol: 'https',
        hostname: 'images.rentals.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images1.apartments.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images1.apartmenthomeliving.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // Add Supabase hostname if available
      ...(supabaseHostname ? [{
        protocol: 'https' as const,
        hostname: supabaseHostname,
        port: '',
        pathname: '/**',
      }] : []),
    ],
  },
  async redirects() {
    return [
      // Redirect old routes to home page
      {
        source: '/for-sale/mn',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/cities',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/counties',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/zips',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/:slug',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/county/:slug',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-sale/mn/zip/:zip',
        destination: '/',
        permanent: true,
      },
      // Redirect old for-rent routes to home page
      {
        source: '/for-rent/mn',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/cities',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/counties',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/zips',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/:slug',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/county/:slug',
        destination: '/',
        permanent: true,
      },
      {
        source: '/for-rent/mn/zip/:zip',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
