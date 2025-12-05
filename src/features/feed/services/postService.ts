/**
 * Post Service
 * Handles all post-related API operations
 */

import type {
  CreatePostData,
  UpdatePostData,
  PostFilters,
  PostVisibility,
} from '../types';

export interface Post {
  id: string;
  account_id: string;
  title?: string | null;
  content: string;
  images?: Array<{ url: string; filename: string; type?: string; [key: string]: unknown }>;
  visibility: PostVisibility;
  type?: 'simple';
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
  full_address?: string | null;
  map_type?: 'pin' | 'area' | 'both' | null;
  map_geometry?: unknown;
  map_center?: unknown;
  map_bounds?: unknown;
  map_hide_pin?: boolean;
  map_screenshot?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostResponse {
  post: Post;
}

export interface GetPostsResponse {
  posts: Post[];
  hasMore: boolean;
}

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(data: CreatePostData): Promise<Post> {
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to create post',
      }));
      throw new Error(errorData.error || 'Failed to create post');
    }

    const result: CreatePostResponse = await response.json();
    return result.post;
  }

  /**
   * Update an existing post
   */
  static async updatePost(id: string, data: UpdatePostData): Promise<Post> {
    const response = await fetch(`/api/feed/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to update post',
      }));
      throw new Error(errorData.error || 'Failed to update post');
    }

    const result: CreatePostResponse = await response.json();
    return result.post;
  }

  /**
   * Delete a post
   */
  static async deletePost(id: string): Promise<void> {
    const response = await fetch(`/api/feed/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to delete post',
      }));
      throw new Error(errorData.error || 'Failed to delete post');
    }
  }

  /**
   * Get a single post by ID
   */
  static async getPost(id: string): Promise<Post> {
    const response = await fetch(`/api/feed/${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to fetch post',
      }));
      throw new Error(errorData.error || 'Failed to fetch post');
    }

    const result: CreatePostResponse = await response.json();
    return result.post;
  }

  /**
   * Get multiple posts with filters
   */
  static async getPosts(filters: PostFilters = {}): Promise<GetPostsResponse> {
    const {
      limit = 20,
      offset = 0,
      city,
      county,
      state,
      visibility,
    } = filters;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (city) params.append('city', city);
    if (county) params.append('county', county);
    if (state) params.append('state', state);
    if (visibility) params.append('visibility', visibility);

    const response = await fetch(`/api/feed?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to fetch posts',
      }));
      throw new Error(errorData.error || 'Failed to fetch posts');
    }

    return response.json();
  }
}


