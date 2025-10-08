'use client';

import { useState } from 'react';
import { HelpArticle, UpdateResourceData, CreateResourceData } from '@/features/help/services/resourcesService';
import { ResourcesService } from '@/features/help/services/resourcesService';

interface EditArticleAdminPanelProps {
  article?: HelpArticle;
  onUpdate: (updatedArticle: HelpArticle) => void;
  onCreate?: (newArticle: HelpArticle) => void;
  onDelete?: (articleId: string) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export default function EditArticleAdminPanel({ 
  article, 
  onUpdate, 
  onCreate, 
  onDelete, 
  onCancel, 
  mode 
}: EditArticleAdminPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    category: article?.category || 'General',
    tags: article?.tags?.join(', ') || '',
    is_published: article?.is_published || false,
    meta_title: article?.meta_title || '',
    meta_description: article?.meta_description || '',
    reading_time_minutes: article?.reading_time_minutes || 5,
    sort_order: article?.sort_order || 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (mode === 'create') {
        const createData: CreateResourceData = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          is_published: formData.is_published,
          meta_title: formData.meta_title || undefined,
          meta_description: formData.meta_description || undefined,
          reading_time_minutes: formData.reading_time_minutes,
          sort_order: formData.sort_order,
        };

        const newArticle = await ResourcesService.createResource(createData);
        
        if (newArticle && onCreate) {
          onCreate(newArticle);
        } else {
          setError('Failed to create article');
        }
      } else {
        const updateData: UpdateResourceData = {
          id: article!.id,
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          is_published: formData.is_published,
          meta_title: formData.meta_title || undefined,
          meta_description: formData.meta_description || undefined,
          reading_time_minutes: formData.reading_time_minutes,
          sort_order: formData.sort_order,
        };

        const updatedArticle = await ResourcesService.updateResource(updateData);
        
        if (updatedArticle) {
          onUpdate(updatedArticle);
        } else {
          setError('Failed to update article');
        }
      }
    } catch (err) {
      console.error('Error saving article:', err);
      setError('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article || !onDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const success = await ResourcesService.deleteResource(article.id);
      
      if (success) {
        onDelete(article.id);
      } else {
        setError('Failed to delete article');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      setError('Failed to delete article');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const autoGenerateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const estimateReadingTime = () => {
    const wordsPerMinute = 200;
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    setFormData(prev => ({ ...prev, reading_time_minutes: minutes }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      {/* Modal */}
      <div className="relative h-screen w-full max-w-4xl mx-auto bg-white overflow-y-auto">
        {/* Header - Branded with MNUDA Logo */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onCancel}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            {/* MNUDA Logo - Centered */}
            <div className="flex-1 flex justify-center">
              <span className="text-xl font-bold">MNUDA</span>
            </div>
            
            {/* Action Buttons - Compact */}
            <div className="flex items-center space-x-2">
              {mode === 'edit' && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
                  title="Delete Article"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 bg-white text-blue-900 text-sm font-medium rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1.5 border border-white/30 text-white text-sm font-medium rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Article Title - Prominent */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Article Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500 text-lg"
              placeholder="Enter article title..."
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
                placeholder="article-url-slug"
                required
              />
              <button
                type="button"
                onClick={autoGenerateSlug}
                className="px-3 py-2 text-sm text-blue-800 hover:text-blue-900 border border-blue-400 rounded-md hover:bg-blue-100"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter HTML content..."
              required
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, etc.
              </p>
              <button
                type="button"
                onClick={estimateReadingTime}
                className="text-xs text-blue-800 hover:text-blue-900"
              >
                Auto-estimate reading time
              </button>
            </div>
          </div>

          {/* Compact Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
              >
                <option value="General">General</option>
                <option value="Getting Started">Getting Started</option>
                <option value="Features">Features</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="API">API</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
              </select>
            </div>

            {/* Reading Time */}
            <div>
              <label htmlFor="reading_time_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Reading Time (minutes)
              </label>
              <input
                type="number"
                id="reading_time_minutes"
                name="reading_time_minutes"
                value={formData.reading_time_minutes}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
              placeholder="Brief description of the article..."
            />
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
                placeholder="SEO title..."
              />
            </div>
            <div>
              <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <input
                type="text"
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-500"
                placeholder="SEO description..."
              />
            </div>
          </div>

          {/* Published Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={formData.is_published}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-800 focus:ring-blue-700 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
              Publish this article
            </label>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Delete Article</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete &quot;{article?.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}