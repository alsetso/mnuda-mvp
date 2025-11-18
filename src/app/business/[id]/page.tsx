'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { BusinessService, Business } from '@/features/business';
import { AdService, type Ad } from '@/features/ads';
import PageLayout from '@/components/PageLayout';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  GlobeAltIcon,
  PencilIcon,
  MegaphoneIcon,
  PlusIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import Link from 'next/link';
import { AdCard } from '@/features/ads/components/AdCard';

export default function BusinessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [viewAsPublic, setViewAsPublic] = useState(false);

  const businessId = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && businessId) {
      loadBusiness();
    }
  }, [user, authLoading, businessId, router]);

  useEffect(() => {
    if (business && isOwner) {
      loadAds();
    }
  }, [business, isOwner]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const { business: businessData, isOwner: ownerStatus } = await BusinessService.getBusinessForViewing(businessId);
      
      if (!businessData) {
        showError('Business not found');
        router.push('/account/business');
        return;
      }

      setBusiness(businessData);
      setIsOwner(ownerStatus);
    } catch (error) {
      console.error('Error loading business:', error);
      showError('Failed to load business');
      router.push('/account/business');
    } finally {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    if (!business) return;
    
    try {
      setAdsLoading(true);
      const businessAds = await AdService.getBusinessAds(business.id);
      setAds(businessAds);
    } catch (error) {
      console.error('Error loading ads:', error);
      // Don't show error for ads, just log it
    } finally {
      setAdsLoading(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await AdService.deleteAd(adId);
      await loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!business || !user) {
    return null;
  }

  const fullAddress = [
    business.address_line1,
    business.city,
    business.state,
    business.zip_code
  ].filter(Boolean).join(', ');

  // Determine if we should show owner features
  const showOwnerFeatures = isOwner && !viewAsPublic;

  // Actions for header (Edit button and Public View toggle)
  const headerActions = (
    <div className="flex items-center gap-3">
      {isOwner && (
        <>
          <button
            onClick={() => setViewAsPublic(!viewAsPublic)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewAsPublic
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gold-100 text-gold-800 hover:bg-gold-200'
            }`}
            title={viewAsPublic ? 'Switch to Owner View' : 'View as Public'}
          >
            <EyeIcon className="w-4 h-4" />
            {viewAsPublic ? 'Owner View' : 'Public View'}
          </button>
          {showOwnerFeatures && (
            <Link
              href={`/account/business?edit=${business.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <PencilIcon className="w-5 h-5" />
              Edit
            </Link>
          )}
        </>
      )}
    </div>
  );

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100 flex flex-col">
        {/* Action Toolbar - Flush with AppHeader, Full Width */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0 w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-end">
              {headerActions}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Hero Section - Full Width */}
          <section className="bg-gradient-to-b from-white to-gold-50 py-16 lg:py-24 w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center space-y-8">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.name}
                        className="w-32 h-32 lg:w-40 lg:h-40 object-cover rounded-2xl border-4 border-white shadow-xl"
                      />
                    ) : (
                      <div className="w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                        <BuildingOfficeIcon className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Business Name */}
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-tight">
                      {business.name}
                    </h1>
                    {business.description && (
                      <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        {business.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <GlobeAltIcon className="w-5 h-5" />
                        Visit Website
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                    {fullAddress && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border-2 border-gray-300 rounded-lg hover:border-gold-500 hover:bg-gold-50 transition-all duration-200 font-medium"
                      >
                        <MapPinIcon className="w-5 h-5" />
                        Get Directions
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
            </div>
          </section>

          {/* Details Section - Full Width */}
          <section className="py-12 lg:py-16 w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-black mb-6">Contact Information</h2>
                    
                    {fullAddress && (
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                            <MapPinIcon className="w-6 h-6 text-gold-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Address</h3>
                            <p className="text-gray-900 text-lg leading-relaxed">{fullAddress}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {business.website && (
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                            <GlobeAltIcon className="w-6 h-6 text-gold-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Website</h3>
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline break-all text-lg font-medium inline-flex items-center gap-2"
                            >
                              {business.website}
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Business Information */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-black mb-6">Business Information</h2>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all duration-200">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="w-6 h-6 text-gold-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Created</h3>
                          <p className="text-gray-900 text-lg">
                            {new Date(business.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {business.updated_at !== business.created_at && (
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-6 h-6 text-gold-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Last Updated</h3>
                            <p className="text-gray-900 text-lg">
                              {new Date(business.updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </section>

          {/* Ads Section - Only for owners in owner view - Full Width */}
          {showOwnerFeatures && (
            <section className="py-12 lg:py-16 bg-white border-t border-gray-200 w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-4xl mx-auto">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                          <MegaphoneIcon className="w-6 h-6 text-gold-600" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-black">Business Ads</h2>
                          <p className="text-sm text-gray-500 mt-1">Manage your advertising campaigns</p>
                        </div>
                      </div>
                      <Link
                        href={`/businesses/ads?business=${business.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Create Ad
                      </Link>
                    </div>

                    {/* Ads Content */}
                    {adsLoading ? (
                      <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent"></div>
                      </div>
                    ) : ads.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <MegaphoneIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2">No ads yet</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                          Create your first ad to start advertising on article pages and reach your target audience
                        </p>
                        <Link
                          href={`/businesses/ads?business=${business.id}`}
                          className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                          <PlusIcon className="w-5 h-5" />
                          Create Your First Ad
                        </Link>
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
            </section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

