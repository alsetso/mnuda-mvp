'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AccountService } from '@/features/auth';
import { supabase } from '@/lib/supabase';

interface City {
  id: string;
  name: string;
}

interface CitySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCityId: string | null;
  onSave: (cityId: string | null) => void;
}

export default function CitySelectModal({
  isOpen,
  onClose,
  initialCityId,
  onSave,
}: CitySelectModalProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(initialCityId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities
  useEffect(() => {
    if (isOpen) {
      loadCities();
      setSelectedCityId(initialCityId);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, initialCityId]);

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(cities.slice(0, 50)); // Show first 50 by default
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = cities
        .filter((city) => city.name.toLowerCase().includes(query))
        .slice(0, 50);
      setFilteredCities(filtered);
    }
  }, [searchQuery, cities]);

  const loadCities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(1000);

      if (error) throw error;
      setCities(data || []);
      setFilteredCities((data || []).slice(0, 50));
    } catch (err) {
      console.error('Error loading cities:', err);
      setError('Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      await AccountService.updateCurrentAccount({
        city_id: selectedCityId,
      });

      onSave(selectedCityId);
      onClose();
    } catch (err) {
      console.error('Error updating city:', err);
      setError(err instanceof Error ? err.message : 'Failed to update city');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedCityId(initialCityId);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const handleRemove = async () => {
    setError(null);
    setIsSaving(true);

    try {
      await AccountService.updateCurrentAccount({
        city_id: null,
      });

      onSave(null);
      onClose();
    } catch (err) {
      console.error('Error removing city:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove city');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Select City</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cities..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-sm"
                disabled={isSaving || isLoading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex-shrink-0">
              {error}
            </div>
          )}

          {/* Cities List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading cities...</p>
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No cities found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCityId(city.id)}
                    disabled={isSaving}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedCityId === city.id
                        ? 'bg-black text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancel
              </button>
            </div>
            {selectedCityId && (
              <button
                onClick={handleRemove}
                disabled={isSaving || isLoading}
                className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove city
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

