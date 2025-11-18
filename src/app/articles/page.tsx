import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import { AdminArticleService } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Articles | MNUDA',
  description: 'Read articles about Minnesota real estate development, acquisition, and industry insights.',
  openGraph: {
    title: 'Articles | MNUDA',
    description: 'Read articles about Minnesota real estate development, acquisition, and industry insights.',
  },
};

export default async function ArticlesPage() {
  const articles = await AdminArticleService.getPublishedArticles();
  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-200 rounded-2xl mb-6">
              <DocumentTextIcon className="w-8 h-8 text-gold-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
              Articles
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Insights, perspectives, and stories about Minnesota real estate development and acquisition.
            </p>
          </div>

          {/* Articles List */}
          <div className="space-y-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group block bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                    <DocumentTextIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-black group-hover:text-gold-600 transition-colors">
                        {article.title}
                      </h2>
                      <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    {article.description && (
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {article.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-500">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not published'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State (if no articles) */}
          {articles.length === 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                No articles available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

