'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /repair route - redirects to /credit
 * This route has been replaced by the new profile-based credit system
 */
export default function RepairPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/credit');
  }, [router]);

  return null;
}

