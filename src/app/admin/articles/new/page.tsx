'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ArticleContentEditor } from '@/features/admin/components/ArticleContentEditor';

export default function NewArticlePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    author_name: 'MNUDA Editorial',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/articles/new&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
        } else {
          router.push('/?message=Access denied. Admin privileges required.');
        }
      } catch (err) {
        router.push('/?message=Failed to verify admin access.');
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent with the request
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create article');
      }

      const article = await response.json();
      router.push(`/admin/articles`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
      setLoading(false);
    }
  };

  if (authLoading || checkingAdmin) {
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

  if (!isAdmin) {
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
              href="/admin/articles"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Articles
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Create New Article
            </h1>
            <p className="text-gray-600 text-lg">
              Write and publish articles for the MNUDA platform
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
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  minLength={3}
                  maxLength={200}
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="Article title"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  required
                  pattern="^[a-z0-9-]+$"
                  minLength={3}
                  maxLength={100}
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-sm"
                  placeholder="article-slug"
                />
                <p className="mt-1 text-sm text-gray-500">
                  URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  maxLength={500}
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none resize-none"
                  placeholder="Brief description of the article"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Author Name */}
              <div>
                <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, author_name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                  placeholder="MNUDA Editorial"
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <ArticleContentEditor
                  content={formData.content}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, content: html }))
                  }
                  placeholder="Start writing your article... Use the toolbar to format text, add links, images, and more."
                />
                {formData.content.length < 10 && (
                  <p className="mt-2 text-sm text-amber-600">
                    Content must be at least 10 characters
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as 'draft' | 'published' | 'archived',
                    }))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gold-500 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Article'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
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

