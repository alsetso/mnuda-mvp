import type { NextConfig } from "next";

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
    ],
  },
  async redirects() {
    return [
      // Redirect old for-sale routes to new unified structure
      {
        source: '/for-sale/mn',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/for-sale/mn/cities',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/for-sale/mn/counties',
        destination: '/mn/counties',
        permanent: true,
      },
      {
        source: '/for-sale/mn/zips',
        destination: '/mn/zips',
        permanent: true,
      },
      {
        source: '/for-sale/mn/:slug',
        destination: '/mn/:slug?status=for-sale',
        permanent: true,
      },
      {
        source: '/for-sale/mn/county/:slug',
        destination: '/mn/county/:slug?status=for-sale',
        permanent: true,
      },
      {
        source: '/for-sale/mn/zip/:zip',
        destination: '/mn/zip/:zip?status=for-sale',
        permanent: true,
      },
      // Redirect old for-rent routes to new unified structure
      {
        source: '/for-rent/mn',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/for-rent/mn/cities',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/for-rent/mn/counties',
        destination: '/mn/counties',
        permanent: true,
      },
      {
        source: '/for-rent/mn/zips',
        destination: '/mn/zips',
        permanent: true,
      },
      {
        source: '/for-rent/mn/:slug',
        destination: '/mn/:slug?status=for-rent',
        permanent: true,
      },
      {
        source: '/for-rent/mn/county/:slug',
        destination: '/mn/county/:slug?status=for-rent',
        permanent: true,
      },
      {
        source: '/for-rent/mn/zip/:zip',
        destination: '/mn/zip/:zip?status=for-rent',
        permanent: true,
      },
      // Redirect marketplace routes to new unified structure
      {
        source: '/marketplace/for-sale',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/marketplace/for-rent',
        destination: '/mn/cities',
        permanent: true,
      },
      {
        source: '/marketplace/for-sale/:slug',
        destination: '/mn/:slug?status=for-sale',
        permanent: true,
      },
      {
        source: '/marketplace/for-rent/:slug',
        destination: '/mn/:slug?status=for-rent',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
