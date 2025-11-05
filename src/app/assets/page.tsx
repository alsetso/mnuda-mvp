'use client';

import { useState, useEffect } from 'react';
import MainContentNav from '@/components/MainContentNav';
import { useAuth } from '@/features/auth';
import { AssetService, Asset } from '@/features/assets';
import { AddAssetModal } from '@/features/assets/components';
import { PlusIcon, BuildingOfficeIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function AssetsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const assetsData = await AssetService.getUserAssets();
        setAssets(assetsData);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAssets();
    }
  }, [user, authLoading]);

  const formatCurrency = (value: number | null): string => {
    if (!value) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MainContentNav title="Assets" />
      
      <div className="space-y-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-black mb-2">Manage Assets</h2>
            <p className="text-gray-600">Track your businesses and properties</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">No assets yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first business or property</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Your First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {asset.type === 'business' ? (
                      <BuildingOfficeIcon className="w-6 h-6 text-gold-600" />
                    ) : (
                      <HomeIcon className="w-6 h-6 text-gold-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {asset.type}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-black mb-2">{asset.name}</h3>
                
                {asset.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{asset.description}</p>
                )}
                
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Owned Since:</span>
                    <span className="font-medium text-black">{formatDate(asset.owned_since)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-bold text-black">{formatCurrency(asset.value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newAsset) => {
          setAssets(prev => [newAsset, ...prev]);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
