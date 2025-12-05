'use client';

import { usePageView } from '@/hooks/usePageView';

interface CountyPageClientProps {
  countyId: string;
  countySlug: string;
}

export default function CountyPageClient({ countyId, countySlug }: CountyPageClientProps) {
  usePageView({
    entity_type: 'county',
    entity_id: countyId,
    enabled: true,
  });

  return null;
}

