/**
 * Dynamic sitemap for Minnesota for-rent localities
 * /sitemap-for-rent-mn.xml
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const supabase = createServerClient();
  const baseUrl = 'https://mnuda.com';

  // Fetch all active cities
  const { data: cities } = await supabase
    .from('cities')
    .select('slug, updated_at')
    .eq('state_code', 'MN')
    .eq('status', 'active')
    .order('slug');

  // Fetch all counties
  const { data: counties } = await supabase
    .from('counties')
    .select('slug, created_at')
    .eq('state_code', 'MN')
    .order('slug');

  // Fetch all zips
  const { data: zips } = await supabase
    .from('zips')
    .select('zip_code, created_at')
    .eq('state_code', 'MN')
    .order('zip_code');

  const now = new Date().toISOString();

  const urls: string[] = [
    // State and index pages (neutral)
    `  <url>
    <loc>${baseUrl}/mn</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/mn/cities</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/mn/counties</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/mn/zips</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
  ];

  // Add cities
  if (cities) {
    for (const city of cities) {
      const lastmod = city.updated_at || now;
      urls.push(`  <url>
    <loc>${baseUrl}/mn/${city.slug}?status=for-rent</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  // Add counties
  if (counties) {
    for (const county of counties) {
      const lastmod = county.created_at || now;
      urls.push(`  <url>
    <loc>${baseUrl}/mn/county/${county.slug}?status=for-rent</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Add zips
  if (zips) {
    for (const zip of zips) {
      const lastmod = zip.created_at || now;
      urls.push(`  <url>
    <loc>${baseUrl}/mn/zip/${zip.zip_code}?status=for-rent</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

