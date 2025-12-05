'use client';

import { usePageView } from '@/hooks/usePageView';

interface ProfilePageClientProps {
  accountId: string;
  accountUsername: string | null;
}

export default function ProfilePageClient({ accountId, accountUsername }: ProfilePageClientProps) {
  usePageView({
    entity_type: 'account',
    entity_slug: accountUsername || accountId,
    enabled: true,
  });

  return null;
}



