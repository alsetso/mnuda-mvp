'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/features/session/components/AppHeader';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import { ResourcesService, HelpArticle } from '@/features/help/services/resourcesService';
import { useAdmin, EditArticleAdminPanel } from '@/components/admin';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { currentSession, sessions, createNewSession, switchSession } = useSessionManager();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the article (use admin version if user is admin)
        const articleData = isAdmin 
          ? await ResourcesService.getResourceBySlugAdmin(slug)
          : await ResourcesService.getResourceBySlug(slug);
        if (!articleData) {
          setError('Article not found');
          return;
        }

        setArticle(articleData);

        // Increment view count
        await ResourcesService.incrementViewCount(slug);

        // Load related articles
        const related = await ResourcesService.getRelatedResources(slug, 3);
        setRelatedArticles(related);

      } catch (err) {
        console.error('Error loading article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadArticle();
    }
  }, [slug, isAdmin]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          currentSession={currentSession}
          sessions={sessions}
          onNewSession={createNewSession}
          onSessionSwitch={switchSession}
          updateUrl={false}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          currentSession={currentSession}
          sessions={sessions}
          onNewSession={createNewSession}
          onSessionSwitch={switchSession}
          updateUrl={false}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Article not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <div className="mt-6">
              <Link
                href="/help-center"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        updateUrl={false}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/help-center" className="text-gray-400 hover:text-gray-500">
                  Help Center
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">{article.title}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Admin Edit Panel */}
            {isAdmin && !adminLoading && article && showEditPanel && (
              <EditArticleAdminPanel
                article={article}
                mode="edit"
                onUpdate={(updatedArticle) => {
                  setArticle(updatedArticle);
                  setShowEditPanel(false);
                }}
                onCancel={() => setShowEditPanel(false)}
              />
            )}

            {/* Admin Edit Button */}
            {isAdmin && !adminLoading && article && !showEditPanel && (
              <div className="mb-6">
                <button
                  onClick={() => setShowEditPanel(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Article
                </button>
              </div>
            )}
            
            <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Article Header */}
              <div className="px-6 py-8 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(article.created_at)}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {formatViewCount(article.view_count)} views
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {article.reading_time_minutes} min read
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                {article.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Article Content */}
              <div className="px-6 py-8">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>

              {/* Article Footer */}
              <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Last updated: {formatDate(article.updated_at)}
                  </div>
                  <div className="flex space-x-4">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Share
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <Link
                      key={relatedArticle.id}
                      href={`/help-center/${relatedArticle.slug}`}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {relatedArticle.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatViewCount(relatedArticle.view_count)} views
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {relatedArticle.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Support */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                </p>
                <a
                  href="mailto:support@mnuda.com"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </a>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/help-center"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    All Help Articles
                  </Link>
                  <Link
                    href="/help-center?category=Getting Started"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Getting Started
                  </Link>
                  <Link
                    href="/help-center?category=Account"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Account & Billing
                  </Link>
                  <Link
                    href="/status"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    System Status
                  </Link>
                </div>
              </div>

              {/* Table of Contents (if content has headings) */}
              {article.content.includes('<h2>') && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
                  <div className="space-y-2 text-sm">
                    {/* This would be dynamically generated from the content */}
                    <a href="#section-1" className="block text-gray-600 hover:text-blue-600">
                      Introduction
                    </a>
                    <a href="#section-2" className="block text-gray-600 hover:text-blue-600">
                      Key Features
                    </a>
                    <a href="#section-3" className="block text-gray-600 hover:text-blue-600">
                      Getting Started
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
