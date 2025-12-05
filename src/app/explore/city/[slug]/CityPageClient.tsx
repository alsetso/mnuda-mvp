'use client';

import { usePageView } from '@/hooks/usePageView';

interface CityPageClientProps {
  cityId: string;
  citySlug: string;
}

export default function CityPageClient({ cityId, citySlug }: CityPageClientProps) {
  usePageView({
    entity_type: 'city',
    entity_id: cityId,
    enabled: true,
  });

  return null;
}

