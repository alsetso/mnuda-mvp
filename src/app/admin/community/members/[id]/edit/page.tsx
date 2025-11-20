'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Member, UpdateMemberData, MemberType } from '@/features/auth/services/memberService';

const MEMBER_TYPES: MemberType[] = ['homeowner', 'investor', 'agent', 'contractor', 'lender', 'advisor'];

export default function AdminMemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateMemberData & { id: string; email: string }>({
    id: '',
    email: '',
    name: '',
    avatar_url: '',
    company: '',
    job_title: '',
    bio: '',
    website: '',
    linkedin_url: '',
    phone: '',
    city: '',
    state: '',
    zip_code: '',
    primary_market_area: '',
    market_radius: null,
    member_type: 'homeowner',
    member_subtype: '',
  });

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setMemberId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/community/members&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadMember(resolvedParams.id);
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

  const loadMember = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/community/members/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load member');
      }
      const member: Member = await response.json();
      setFormData({
        id: member.id,
        email: member.email,
        name: member.name || '',
        avatar_url: member.avatar_url || '',
        company: member.company || '',
        job_title: member.job_title || '',
        bio: member.bio || '',
        website: member.website || '',
        linkedin_url: member.linkedin_url || '',
        phone: member.phone || '',
        city: member.city || '',
        state: member.state || '',
        zip_code: member.zip_code || '',
        primary_market_area: member.primary_market_area || '',
        market_radius: member.market_radius || null,
        member_type: member.member_type,
        member_subtype: member.member_subtype || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { id, email, ...updateData } = formData;
      // Convert empty strings to null
      const cleanedData: UpdateMemberData = {};
      Object.entries(updateData).forEach(([key, value]) => {
        cleanedData[key as keyof UpdateMemberData] = value === '' ? null : value;
      });

      const response = await fetch(`/api/admin/community/members/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update member');
      }

      router.push(`/admin/community/members/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
      setSaving(false);
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

  if (!isAdmin || !memberId) {
    return null;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <Link
              href={`/admin/community/members/${memberId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Member
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Edit Member
            </h1>
            <p className="text-gray-600 text-lg">
              Update member profile information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Full name"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Company & Job Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, company: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, job_title: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                    placeholder="MN"
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, zip_code: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Member Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="member_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Member Type
                  </label>
                  <select
                    id="member_type"
                    value={formData.member_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        member_type: e.target.value as MemberType,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  >
                    {MEMBER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="member_subtype" className="block text-sm font-medium text-gray-700 mb-2">
                    Member Subtype
                  </label>
                  <input
                    type="text"
                    id="member_subtype"
                    value={formData.member_subtype}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, member_subtype: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Market Area */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primary_market_area" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Market Area
                  </label>
                  <input
                    type="text"
                    id="primary_market_area"
                    value={formData.primary_market_area}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primary_market_area: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="market_radius" className="block text-sm font-medium text-gray-700 mb-2">
                    Market Radius (miles)
                  </label>
                  <input
                    type="number"
                    id="market_radius"
                    min="1"
                    max="99"
                    value={formData.market_radius || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        market_radius: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Website & LinkedIn */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, website: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none resize-none"
                  placeholder="Member bio..."
                />
              </div>

              {/* Note about role */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> To change member role, use the "Change Role" button on the member detail page.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

