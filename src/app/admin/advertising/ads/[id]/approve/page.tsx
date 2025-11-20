'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Ad } from '@/features/ads/types';

export default function AdminAdApprovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [adId, setAdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setAdId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/advertising/ads&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadAd(resolvedParams.id);
        } else {
          router.push('/?message=Access denied. Admin privileges required.');
        }
      } catch (err) {
        router.push('/?message=Failed to verify admin access.');
      } finally {
        setCheckingAdmin(false);
      }
    };

    init();
  }, [user, authLoading, router, params]);

  const loadAd = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/advertising/ads/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load ad');
      }
      const adData: Ad = await response.json();
      setAd(adData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ad');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!adId) return;
    
    setApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/advertising/ads/${adId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve ad');
      }

      router.push(`/admin/advertising/ads/${adId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve ad');
      setApproving(false);
    }
  };

  if (authLoading || checkingAdmin || loading) {
    return (
      <PageLayout
        showHeader={true}
        showFooter={false}
        containerMaxWidth="full"
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin || !adId || !ad) {
    return null;
  }

  if (ad.status === 'active') {
    return (
      <PageLayout
        showHeader={true}
        showFooter={false}
        containerMaxWidth="full"
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100 py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
              <p className="text-gray-600 mb-4">This ad is already active.</p>
              <Link
                href={`/admin/advertising/ads/${adId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Back to Ad
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/admin/advertising/ads/${adId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Ad
          </Link>

          {/* Approve Confirmation */}
          <div className="bg-white border-2 border-green-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">
                  Approve Ad
                </h1>
                <p className="text-gray-600">
                  Activate this advertisement and make it visible to users.
                </p>
              </div>
            </div>

            {/* Ad Info */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-4">
                {ad.image_url && (
                  <img
                    src={ad.image_url}
                    alt={ad.headline}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-bold text-black mb-1">{ad.headline}</h2>
                  {ad.description && (
                    <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Placement: {ad.placement.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Current Status: <span className="capitalize">{ad.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? 'Approving...' : 'Approve Ad'}
              </button>
              <button
                onClick={() => router.back()}
                disabled={approving}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

