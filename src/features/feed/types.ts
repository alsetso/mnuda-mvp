/**
 * Shared type definitions for the feed/posting system
 */

export type PostVisibility = 'public' | 'draft';

export type MediaType = 'image' | 'video';

export interface MediaPreview {
  url: string;
  filename: string;
  type: string;
  poster?: string;
  file?: File;
}

export interface UploadedMedia {
  url: string;
  filename: string;
  type: MediaType;
  thumbnail_url?: string;
  mime_type?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  order?: number;
}

export type PostType = 'simple';

export interface CreatePostData {
  title?: string;
  content: string;
  visibility: PostVisibility;
  type?: PostType;
  media?: UploadedMedia[];
  account_id?: string;
  profile_id?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  full_address?: string;
  map_data?: unknown;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  visibility?: PostVisibility;
}

export interface PostFilters {
  limit?: number;
  offset?: number;
  city?: string;
  county?: string;
  state?: string;
  visibility?: PostVisibility | 'all' | 'only_me';
}

export interface UploadProgress {
  stage: 'idle' | 'uploading' | 'submitting' | 'complete';
  progress: number;
  currentFile?: string;
}

export interface MediaUploadOptions {
  userId: string;
  storageBucket?: string;
  pathPrefix?: string;
  maxFileSize?: number;
  onProgress?: (progress: number) => void;
}

export interface ThumbnailResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  duration?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

