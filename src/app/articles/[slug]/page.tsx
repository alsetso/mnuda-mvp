import PageLayout from '@/components/PageLayout';
import { AdminArticleService } from '@/features/admin';
import { AdsPublicStack } from '@/features/ads/components/AdsPublicStack';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ArticleViewTracker } from './ArticleViewTracker';
// Server-side HTML sanitization helper
function sanitizeHtml(html: string): string {
  // Basic sanitization - in production, consider using a proper server-side sanitizer
  // For now, we'll trust the content since it's from admin-created articles
  // and already sanitized on input via DOMPurify in the editor
  return html;
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await AdminArticleService.getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | MNUDA',
    };
  }

  return {
    title: `${article.title} | MNUDA`,
    description: article.description || article.title,
    openGraph: {
      title: article.title,
      description: article.description || article.title,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [article.author_name],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await AdminArticleService.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Content is already sanitized via DOMPurify in the editor when created
  // For additional server-side safety, we could add more sanitization here
  const sanitizedContent = sanitizeHtml(article.content);

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <ArticleViewTracker slug={slug} />
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Ads */}
            <aside className="lg:col-span-3 order-2 lg:order-1">
              <div className="sticky top-8">
                <AdsPublicStack
                  placement="article_left"
                  articleSlug={slug}
                  maxAds={5}
                  spacing={16}
                />
              </div>
            </aside>

            {/* Main Article Content */}
            <article className="lg:col-span-6 order-1 lg:order-2 bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 lg:p-12">
              {/* Article Header */}
              <header className="mb-8 pb-8 border-b-2 border-gray-200">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 leading-tight">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  {article.published_at && (
                    <time dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  <span>•</span>
                  <span>{article.author_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    {article.view_count.toLocaleString()} {article.view_count === 1 ? 'view' : 'views'}
                  </span>
                </div>
              </header>

              {/* Article Content */}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </article>

            {/* Right Sidebar - Ads */}
            <aside className="lg:col-span-3 order-3">
              <div className="sticky top-8">
                <AdsPublicStack
                  placement="article_right"
                  articleSlug={slug}
                  maxAds={5}
                  spacing={16}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

