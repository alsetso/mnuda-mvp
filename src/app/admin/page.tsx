import { getServerAuth } from '@/lib/authServer';
import { redirect } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { DocumentTextIcon, PlusIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | MNUDA',
  description: 'Admin dashboard for managing content and metrics.',
  robots: 'noindex, nofollow',
};

export default async function AdminPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/admin&message=Please sign in to access admin panel');
  }
  
  if (auth.role !== 'admin') {
    redirect('/?message=Access denied. Admin privileges required.');
  }
  
  const admin = { id: auth.id, email: auth.email, name: auth.name };

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
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, {admin.name || admin.email}
            </p>
          </div>

          {/* Admin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Articles Management */}
            <Link
              href="/admin/articles"
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                  <DocumentTextIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-black mb-1 group-hover:text-gold-600 transition-colors">
                    Articles
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Manage article content and view metrics
                  </p>
                </div>
              </div>
            </Link>

            {/* Create New Article */}
            <Link
              href="/admin/articles/new"
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                  <PlusIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-black mb-1 group-hover:text-gold-600 transition-colors">
                    New Article
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Create a new article to publish
                  </p>
                </div>
              </div>
            </Link>

            {/* Pin Categories Management */}
            <Link
              href="/admin/pin-categories"
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                  <TagIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-black mb-1 group-hover:text-gold-600 transition-colors">
                    Pin Categories
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Manage map filter visibility
                  </p>
                </div>
              </div>
            </Link>

            {/* Analytics Placeholder */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 opacity-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-400 mb-1">
                    Analytics
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

