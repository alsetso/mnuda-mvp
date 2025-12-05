'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountService, useAuth, type Account } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { PencilIcon } from '@heroicons/react/24/outline';
import FeedPost from '@/components/feed/FeedPost';
import Views from '@/components/ui/Views';
import VisitorsList from '@/components/analytics/VisitorsList';
import PageViewsList from '@/components/analytics/PageViewsList';
import IntroductionEditorModal from '@/components/profile/IntroductionEditorModal';
import AccountTraits from '@/components/profile/AccountTraits';
import CompactFooter from '@/components/feed/CompactFooter';
import { PostCreationCard } from '@/features/posts';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  images: unknown;
  media_type: string;
  visibility: string;
  view_count: number;
  created_at: string;
}

interface ProfileClientProps {
  account: Account & {
    username: string | null;
    cover_image_url: string | null;
    view_count: number;
  };
  posts: Post[];
  isOwnProfile: boolean;
}

export default function ProfileClient({
  account,
  posts,
  isOwnProfile,
}: ProfileClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [showIntroductionEditor, setShowIntroductionEditor] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account>(account);
  const [currentCityName, setCurrentCityName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = AccountService.getDisplayName(currentAccount);

  // Fetch city name from city_id
  useEffect(() => {
    const fetchCityName = async () => {
      if (!currentAccount.city_id) {
        setCurrentCityName(null);
        return;
      }

      // Validate city_id format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentAccount.city_id)) {
        console.error('Invalid city_id format:', currentAccount.city_id);
        setCurrentCityName(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cities')
          .select('name')
          .eq('id', currentAccount.city_id)
          .single();

        if (error) {
          // Log error but don't break the page
          if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching city name:', error);
          }
          setCurrentCityName(null);
          return;
        }

        if (data?.name) {
          setCurrentCityName(data.name);
        } else {
          setCurrentCityName(null);
        }
      } catch (err) {
        console.error('Error fetching city name:', err);
        setCurrentCityName(null);
      }
    };

    fetchCityName();
  }, [currentAccount.city_id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !account) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    // Validate file size (minimum 1KB)
    if (file.size < 1024) {
      alert('Image file is too small');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${user.id}/accounts/cover/${timestamp}-${random}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('cover-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cover-photos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      // Update account with new cover image URL
      const updatedAccount = await AccountService.updateCurrentAccount({
        cover_image_url: urlData.publicUrl,
      });

      // Update local state
      setCurrentAccount(prev => ({ ...prev, cover_image_url: urlData.publicUrl }));
    } catch (error) {
      console.error('Error uploading cover image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload cover image';
      alert(errorMessage);
      // Don't update state on error
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-[10px] pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column - Majority (8 columns) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Profile Card with Cover, Profile Image, and About */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden relative">
              {/* Cover Image */}
              <div className="h-32 sm:h-40 bg-gray-200 relative z-0">
                {currentAccount.cover_image_url ? (
                  <Image
                    src={currentAccount.cover_image_url}
                    alt="Cover"
                    fill
                    className="object-cover"
                    unoptimized={currentAccount.cover_image_url.includes('supabase.co')}
                  />
                ) : null}
                {isOwnProfile && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute top-2 right-2 px-[10px] py-[10px] bg-white rounded-md hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <PencilIcon className="w-3 h-3" />
                          {currentAccount.cover_image_url ? 'Change' : 'Add'} Cover
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Profile Content */}
              <div className="px-[10px] pb-[10px] relative">
                {/* Profile Photo - Overlapping Cover */}
                <div className="flex -mt-12 mb-3 relative z-10">
                  {currentAccount.image_url ? (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-white overflow-hidden relative z-10">
                      <Image
                        src={currentAccount.image_url}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized={currentAccount.image_url.includes('supabase.co')}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center relative z-10">
                      <span className="text-gray-500 font-medium text-2xl">{displayName.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Name & Info */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h1 className="text-sm font-semibold text-gray-900">{displayName}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowIntroductionEditor(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Edit Introduction"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {currentAccount.username && (
                    <p className="text-xs text-gray-500 mb-2">@{currentAccount.username}</p>
                  )}
                  {/* Bio */}
                  <div className="mb-2">
                    {currentAccount.bio ? (
                      <p className="text-xs text-gray-600 leading-relaxed">{currentAccount.bio}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No bio yet</p>
                    )}
                  </div>
                  {/* City */}
                  <div className="mb-2">
                    {currentCityName ? (
                      <p className="text-xs text-gray-600">{currentCityName}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No city yet</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    {currentAccount.age && (
                      <span>{currentAccount.age} years old</span>
                    )}
                    {currentAccount.gender && (
                      <span className="capitalize">{currentAccount.gender}</span>
                    )}
                  </div>
                  {/* Traits */}
                  <div className="mt-2">
                    <AccountTraits traits={currentAccount.traits} />
                  </div>
                </div>
              </div>
            </div>

            {/* Visitors List (Premium Feature) - Only for own profile */}
            {isOwnProfile && (
              <div className="space-y-4">
                <VisitorsList 
                  entityType="account" 
                  entityId={currentAccount.id}
                  entitySlug={currentAccount.username || undefined}
                />
              </div>
            )}

            {/* Main Content - Posts */}
            <div className="space-y-3">
              {/* Post Creation Card - Only for own profile */}
              {isOwnProfile && (
                <PostCreationCard 
                  onPostCreated={() => {
                    router.refresh();
                  }}
                  account={currentAccount}
                  cityId={currentAccount.city_id || undefined}
                />
              )}

              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-md border border-gray-200 p-[10px]">
                    <FeedPost
                      post={{
                        id: post.id,
                        account_id: currentAccount.id,
                        title: post.title,
                        content: post.content,
                        images: post.images || null,
                        visibility: post.visibility as 'public' | 'draft',
                        view_count: post.view_count,
                        created_at: post.created_at,
                        updated_at: post.created_at,
                        map_type: post.map_type,
                        map_geometry: post.map_geometry,
                        map_center: post.map_center,
                        map_screenshot: post.map_screenshot,
                        map_data: post.map_data,
                        accounts: {
                          id: currentAccount.id,
                          first_name: currentAccount.first_name,
                          last_name: currentAccount.last_name,
                          image_url: currentAccount.image_url,
                        },
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-md border border-gray-200 p-[10px] text-center">
                  <p className="text-xs text-gray-500">No posts yet.</p>
                  {isOwnProfile && (
                    <Link
                      href="/feed"
                      className="mt-2 inline-block text-xs text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Create your first post
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar (4 columns) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Stats Card */}
            <div className="bg-white rounded-md border border-gray-200 p-[10px] sticky top-3">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-medium text-gray-900">{posts.length}</span>
                </div>
                {currentAccount.view_count > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Profile Views</span>
                    <Views count={currentAccount.view_count} size="sm" className="font-medium text-gray-900" />
                  </div>
                )}
              </div>
            </div>

            {/* Page Views List (Premium Feature) */}
            {isOwnProfile && (
              <div className="space-y-4">
                <PageViewsList
                  entityType="account"
                  entityId={currentAccount.id}
                  entitySlug={currentAccount.username || undefined}
                />
                <CompactFooter />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Introduction Editor Modal */}
      {isOwnProfile && (
        <IntroductionEditorModal
          isOpen={showIntroductionEditor}
          onClose={() => setShowIntroductionEditor(false)}
          initialAccount={currentAccount}
          onSave={(updatedAccount) => {
            setCurrentAccount(updatedAccount as typeof currentAccount);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}


