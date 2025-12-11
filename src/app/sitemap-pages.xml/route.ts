/**
 * Static pages sitemap
 * /sitemap-pages.xml
 * Includes all static pages like contact, legal, business, etc.
 */

import { NextResponse } from 'next/server';

export const revalidate = 86400; // Revalidate daily

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mnuda.com';
  const now = new Date().toISOString();

  // Static pages with their priorities and change frequencies
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly' },
    { path: '/map', priority: '0.9', changefreq: 'weekly' },
    { path: '/explore', priority: '0.9', changefreq: 'weekly' },
    { path: '/feed', priority: '0.9', changefreq: 'daily' },
    { path: '/business', priority: '0.8', changefreq: 'monthly' },
    { path: '/business/directory', priority: '0.9', changefreq: 'weekly' },
    { path: '/legal', priority: '0.6', changefreq: 'yearly' },
    { path: '/legal/terms-of-service', priority: '0.6', changefreq: 'yearly' },
    { path: '/legal/privacy-policy', priority: '0.6', changefreq: 'yearly' },
    { path: '/legal/user-agreement', priority: '0.6', changefreq: 'yearly' },
    { path: '/legal/community-guidelines', priority: '0.6', changefreq: 'yearly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

