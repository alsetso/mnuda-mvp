'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoIcon, MapPinIcon } from '@heroicons/react/24/outline';
import ProfilePhoto from '@/components/ProfilePhoto';
import { useAuth, AccountService, Account } from '@/features/auth';
import PostPublisherModal from './PostPublisherModal';
import MediaUploadEditor from './MediaUploadEditor';
import PostMapModal, { PostMapData } from './PostMapModal';

interface PostCreationCardProps {
  onPostCreated?: () => void;
}

export default function PostCreationCard({ onPostCreated }: PostCreationCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<Array<{ url: string; filename: string; type: string; thumbnail_url?: string }>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<Array<{ url: string; file: File; type: string }>>([]);
  const [pendingMapData, setPendingMapData] = useState<PostMapData | null>(null);

  // Load account data
  useEffect(() => {
    if (user) {
      AccountService.getCurrentAccount()
        .then(setAccount)
        .catch((err) => {
          console.error('Error loading account:', err);
        });
    }
  }, [user]);

  const handleInputClick = () => {
    setShowPostModal(true);
  };

  const handleMediaClick = () => {
    setShowMediaEditor(true);
  };

  const handleMapClick = () => {
    setShowMapModal(true);
  };


  if (!user) return null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-md p-[10px] mb-3">
        <div className="flex items-start gap-2">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <ProfilePhoto 
              account={account}
              size="sm" 
            />
          </div>

          {/* Input Area */}
          <div className="flex-1">
            <button
              onClick={handleInputClick}
              className="w-full px-[10px] py-[10px] text-left bg-gray-50 border border-gray-200 rounded-md hover:border-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-500 text-xs"
            >
              <span className="text-gray-500">Start a post</span>
            </button>

            {/* Action Options */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                onClick={handleMediaClick}
                className="flex items-center gap-2 px-[10px] py-[10px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors group"
              >
                <PhotoIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                <span className="text-xs font-medium">Media</span>
              </button>
              
              <button
                onClick={handleMapClick}
                className="flex items-center gap-2 px-[10px] py-[10px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors group"
              >
                <MapPinIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                <span className="text-xs font-medium">Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Media Upload Editor */}
      {showMediaEditor && (
        <MediaUploadEditor
          isOpen={showMediaEditor}
          onClose={() => {
            setShowMediaEditor(false);
          }}
          account={account}
          onUploadComplete={onPostCreated}
          initialFiles={pendingFiles}
          initialPreviews={pendingPreviews}
          onMediaReady={(media, files) => {
            setPendingMedia(media);
            setPendingFiles(files);
            const previews = media.map((m, idx) => ({
              url: m.url,
              file: files[idx],
              type: m.type,
            }));
            setPendingPreviews(previews);
            setShowMediaEditor(false);
            setShowPostModal(true);
          }}
        />
      )}

      {/* Map Modal */}
      {showMapModal && (
        <PostMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
          }}
          initialMapData={pendingMapData}
          onSave={(mapData) => {
            setPendingMapData(mapData);
            setShowMapModal(false);
            setShowPostModal(true);
          }}
        />
      )}

      {/* Post Publisher Modal */}
      {showPostModal && (
        <PostPublisherModal
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false);
            setPendingMedia([]);
            setPendingFiles([]);
            setPendingPreviews([]);
            setPendingMapData(null);
          }}
          initialFiles={pendingFiles}
          account={account}
          onPostCreated={onPostCreated}
          initialMedia={pendingMedia}
          initialMapData={pendingMapData}
          onBackToMedia={
            pendingMedia.length > 0
              ? () => {
                  setShowPostModal(false);
                  setShowMediaEditor(true);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

