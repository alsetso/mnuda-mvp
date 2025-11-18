import { getServerAuth } from '@/lib/authServer';
import { redirect } from 'next/navigation';
import { AdminArticleService } from '@/features/admin';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { DocumentTextIcon, PlusIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Articles | MNUDA',
  description: 'Manage articles and view metrics.',
  robots: 'noindex, nofollow',
};

export default async function AdminArticlesPage() {
  const auth = await getServerAuth();
  
  // Debug logging (remove in production)
  console.log('Admin Articles Page - Auth check:', {
    hasAuth: !!auth,
    role: auth?.role,
    roleType: typeof auth?.role,
    email: auth?.email,
  });
  
  if (!auth) {
    redirect('/login?redirect=/admin/articles&message=Please sign in to access admin panel');
  }
  
  if (auth.role !== 'admin') {
    console.log('Access denied - role mismatch:', {
      expected: 'admin',
      actual: auth.role,
      roleType: typeof auth.role,
    });
    redirect('/?message=Access denied. Admin privileges required.');
  }
  
  const articles = await AdminArticleService.getAllArticles();

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
                Articles
              </h1>
              <p className="text-gray-600 text-lg">
                Manage article content and view metrics
              </p>
            </div>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              New Article
            </Link>
          </div>

          {/* Articles List */}
          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-gold-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-black mb-1">
                            {article.title}
                          </h2>
                          {article.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {article.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            article.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : article.status === 'draft'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {article.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{article.view_count.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {article.published_at
                              ? new Date(article.published_at).toLocaleDateString()
                              : 'Not published'}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span>Slug: {article.slug}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-6">
                No articles yet. Create your first article to get started.
              </p>
              <Link
                href="/admin/articles/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Create Article
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

