'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#014463] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-600">Redirecting...</div>
      </div>
    </div>
  );
}
