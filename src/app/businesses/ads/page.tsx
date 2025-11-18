'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { AdService, type Ad } from '@/features/ads';
import { BusinessService, type Business } from '@/features/business';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import { CreateAdModal } from '@/features/ads/components/CreateAdModal';
import { AdCard } from '@/features/ads/components/AdCard';
import Link from 'next/link';

export default function AdsPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams?.get('business');
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { success, error: showError } = useToast();

  const loadAds = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (businessId) {
        // Load business first
        const { business: businessData } = await BusinessService.getBusinessForViewing(businessId);
        if (businessData) {
          setBusiness(businessData);
          // Load ads for this business
          const businessAds = await AdService.getBusinessAds(businessId);
          setAds(businessAds);
        } else {
          showError('Business not found');
        }
      } else {
        // Load all user ads
        const userAds = await AdService.getUserAds();
        setAds(userAds);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
      showError('Failed to Load', 'Could not load your ads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [user, businessId]);

  const handleCreateAd = async (data: Parameters<typeof AdService.createAd>[0]) => {
    try {
      // If business_id is provided in query, use it
      const adData = businessId ? { ...data, business_id: businessId } : data;
      const ad = await AdService.createAd(adData);
      success('Ad Created', `${ad.headline} has been created!`);
      await loadAds();
      setIsCreateModalOpen(false);
      return ad;
    } catch (err) {
      showError('Failed to Create Ad', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await AdService.deleteAd(adId);
      success('Ad Deleted', 'Your ad has been deleted.');
      await loadAds();
    } catch (err) {
      showError('Failed to Delete', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to manage ads.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100">
        {/* Hero Section */}
        <div className="bg-black text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              {business && (
                <div className="mb-6">
                  <Link
                    href={`/business/${business.id}`}
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to {business.name}
                  </Link>
                </div>
              )}
              <h1 className="text-6xl font-bold mb-6">
                {business ? `${business.name} Ads` : 'Manage Your Ads'}
              </h1>
              <p className="text-2xl text-white/80 mb-8 leading-relaxed">
                Create and manage advertisements for article page placements across Minnesota.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Ad
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-16 text-center">
              <p className="text-gray-500 text-lg mb-2">
                You haven't created any ads yet.
              </p>
              <p className="text-gray-400 mb-6">
                Create your first ad to start advertising on article pages!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create Ad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onDelete={handleDeleteAd}
                  onUpdate={loadAds}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Ad Modal */}
      <CreateAdModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAd={handleCreateAd}
      />
    </PageLayout>
  );
}

