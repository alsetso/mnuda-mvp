'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import CategoryAutocomplete from '@/features/ui/components/CategoryAutocomplete';

interface CreateBusinessFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface City {
  id: string;
  name: string;
}

export default function CreateBusinessForm({ onSuccess, onCancel }: CreateBusinessFormProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities for service areas
  useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name')
          .order('name', { ascending: true })
          .limit(1000);

        if (error) throw error;
        setCities(data || []);
      } catch (err) {
        console.error('Error loading cities:', err);
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Geocode address when address changes
  useEffect(() => {
    if (!address.trim()) {
      setLat(null);
      setLng(null);
      return;
    }

    const geocodeAddress = async () => {
      try {
        const response = await fetch(`/api/geocode/autocomplete?query=${encodeURIComponent(address)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && data.suggestions.length > 0) {
            const first = data.suggestions[0];
            if (first.lat && first.lng) {
              setLat(first.lat);
              setLng(first.lng);
            }
          }
        }
      } catch (err) {
        // Silently fail - coordinates are optional
        console.error('Geocoding error:', err);
      }
    };

    const timeoutId = setTimeout(geocodeAddress, 500);
    return () => clearTimeout(timeoutId);
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Page name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to create a business');
        return;
      }

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          category_id: categoryId,
          address: address.trim() || null,
          lat,
          lng,
          email: email.trim() || null,
          phone: phone.trim() || null,
          hours: hours.trim() || null,
          service_areas: selectedCities.length > 0 ? selectedCities : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create business');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCity = (cityId: string) => {
    setSelectedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Add New Page</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          type="button"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Page Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <CategoryAutocomplete
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Search for a category (e.g., Developer, Contractor, Realtor)"
            label="Category"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full business address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {lat && lng && (
            <p className="mt-1 text-xs text-gray-500">
              Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@business.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
            Page Hours
          </label>
          <textarea
            id="hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g., Mon-Fri: 9am-5pm&#10;Sat: 10am-2pm"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Areas (Cities)
          </label>
          {isLoadingCities ? (
            <p className="text-sm text-gray-500">Loading cities...</p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              <div className="space-y-2">
                {cities.map((city) => (
                  <label
                    key={city.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city.id)}
                      onChange={() => toggleCity(city.id)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">{city.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {selectedCities.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {selectedCities.length} city{selectedCities.length !== 1 ? 'ies' : 'y'} selected
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                Create Page
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}



