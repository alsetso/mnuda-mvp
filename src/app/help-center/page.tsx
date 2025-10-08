'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppHeader from '@/features/session/components/AppHeader';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import { ResourcesService, HelpArticle } from '@/features/help/services/resourcesService';
import { useAdmin, EditArticleAdminPanel } from '@/components/admin';

export default function HelpCenterPage() {
  const { currentSession, sessions, createNewSession, switchSession } = useSessionManager();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'title' | 'category'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

  // Load articles and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load articles and categories in parallel
        const [articlesData, categoriesData] = await Promise.all([
          ResourcesService.getPublishedResources(),
          ResourcesService.getCategories()
        ]);

        setArticles(articlesData);
        setCategories(['All', ...categoriesData]);
      } catch (err) {
        console.error('Error loading help center data:', err);
        setError('Failed to load help articles');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Enhanced filtering and sorting
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = articles.filter(article => article.is_published);

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Enhanced search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(article => {
        const searchableText = [
          article.title,
          article.excerpt,
          article.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
          ...article.tags
        ].join(' ').toLowerCase();

        // Simple fuzzy matching - check if all words in query exist in searchable text
        const queryWords = query.split(/\s+/);
        return queryWords.every(word => searchableText.includes(word));
      });
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        return filtered.sort((a, b) => b.view_count - a.view_count);
      case 'recent':
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'title':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'category':
        return filtered.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return filtered;
    }
  }, [articles, searchQuery, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Admin functions
  const handleCreateArticle = async (newArticle: HelpArticle) => {
    setArticles(prev => [newArticle, ...prev]);
    setShowCreateModal(false);
  };

  const handleUpdateArticle = async (updatedArticle: HelpArticle) => {
    setArticles(prev => prev.map(article => 
      article.id === updatedArticle.id ? updatedArticle : article
    ));
    setEditingArticle(null);
  };

  const handleDeleteArticle = async (articleId: string) => {
    setArticles(prev => prev.filter(article => article.id !== articleId));
    setEditingArticle(null);
  };

  const handleEditArticle = (article: HelpArticle) => {
    setEditingArticle(article);
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedArticles.size === filteredAndSortedArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(filteredAndSortedArticles.map(a => a.id)));
    }
  };

  // Compact Article Card Component
  const ArticleCard = ({ article }: { article: HelpArticle }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isAdmin && !adminLoading && (
            <input
              type="checkbox"
              checked={selectedArticles.has(article.id)}
              onChange={() => handleSelectArticle(article.id)}
              className="w-4 h-4 text-blue-800 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
            {article.category}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDate(article.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && !adminLoading && (
            <button
              onClick={() => handleEditArticle(article)}
              className="p-1 text-gray-400 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Edit article"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <Link href={`/help-center/${article.slug}`}>
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
      
      <Link href={`/help-center/${article.slug}`} className="block">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-900 transition-colors">
          {article.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {formatViewCount(article.view_count)}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {article.reading_time_minutes}m
            </div>
          </div>
          {article.tags.length > 0 && (
            <div className="flex items-center gap-1 max-w-20">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="truncate">{article.tags[0]}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        updateUrl={false}
      />

      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAndSortedArticles.length} articles • Find answers and learn how to use MNUDA
              </p>
            </div>
            {isAdmin && !adminLoading && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Admin
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Article
                </button>
              </div>
            )}
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'title' | 'category')}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
                <option value="title">Title A-Z</option>
                <option value="category">Category</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-50 text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Admin Bulk Actions */}
          {isAdmin && !adminLoading && selectedArticles.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-900">
                  {selectedArticles.size} article{selectedArticles.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-800 hover:text-blue-900"
                  >
                    {selectedArticles.size === filteredAndSortedArticles.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-800">
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Articles Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading articles</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedArticles.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or browse all categories.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredAndSortedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Compact Support Section */}
      <div className="bg-blue-50 border-t border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Contact our support team for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="mailto:support@mnuda.com"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-md hover:bg-blue-900 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <Link
                href="/status"
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                System Status
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      {showCreateModal && (
        <EditArticleAdminPanel
          mode="create"
          onCreate={handleCreateArticle}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingArticle && (
        <EditArticleAdminPanel
          article={editingArticle}
          mode="edit"
          onUpdate={handleUpdateArticle}
          onDelete={handleDeleteArticle}
          onCancel={() => setEditingArticle(null)}
        />
      )}
    </div>
  );
}