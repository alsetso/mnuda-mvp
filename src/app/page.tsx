'use client';

import { useMemo } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import Link from 'next/link';
import { 
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { navItems, getNavItemsByCategory } from '@/config/navigation';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();

  // Filter nav items to exclude Home and Settings from the directory
  // Must be called unconditionally (hooks rules)
  const directoryItems = useMemo(() => {
    return navItems.filter(item => item.href !== '/' && item.href !== '/settings');
  }, []);

  const categorizedItems = useMemo(() => {
    return getNavItemsByCategory();
  }, []);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <PageLayout showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is logged in, show mission header and directory page
  if (user) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen py-12">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mission Header Section */}
            <div className="mb-16">
              <div className="bg-black text-white rounded-2xl p-8 md:p-12 lg:p-16 mb-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.05em] mb-6 font-libre-baskerville italic">
                    For the Love of Minnesota
                  </h1>
                  <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                    Every business we develop, every asset we acquire, and every community we support is part of our commitment to making Minnesota a better place to live, work, and invest.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-2xl font-black text-gold-400 mb-2">Growth</div>
                      <p className="text-gray-300 text-sm">Building sustainable businesses that strengthen our economic foundation</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-2xl font-black text-gold-400 mb-2">Impact</div>
                      <p className="text-gray-300 text-sm">Creating value that benefits communities and investors alike</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="text-2xl font-black text-gold-400 mb-2">Vision</div>
                      <p className="text-gray-300 text-sm">Transforming opportunities into lasting contributions to Minnesota</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Directory Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-4 text-center">
                Explore Features
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                Choose a feature to get started. Each tool is designed to help you accomplish specific tasks.
              </p>

              {/* Grouped by Category */}
              <div className="space-y-12">
                {Array.from(categorizedItems.entries())
                  .filter(([category]) => category !== 'Main' && category !== 'Account')
                  .map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold text-black mb-4 pb-2 border-b border-gray-300">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                                  <Icon className="w-6 h-6 text-gold-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-bold text-black mb-2 group-hover:text-gold-600 transition-colors">
                                    {item.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Unlisted items (if any) */}
              {directoryItems.filter(item => !item.category || item.category === 'Other').length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-black mb-4 pb-2 border-b border-gray-300">
                    Other
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {directoryItems
                      .filter(item => !item.category || item.category === 'Other')
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                                <Icon className="w-6 h-6 text-gold-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-black mb-2 group-hover:text-gold-600 transition-colors">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is not logged in, show landing page
  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center bg-gradient-to-b from-gold-100 via-gold-50 to-gold-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-block mb-6">
              <span className="text-xs font-bold tracking-widest uppercase text-gold-600 bg-gold-200/50 px-4 py-2 rounded-full">
                Under Dev & Acq
              </span>
            </div>
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-medium tracking-[-0.105em] text-black mb-8 leading-tight font-libre-baskerville italic">
              For the Love of
              <span className="block text-gold-600 mt-2">Minnesota</span>
              </h1>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
              We combine technology, capital, and strategy to acquire and develop high-value real estate and business opportunities that strengthen our state&apos;s economic foundation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-lg font-bold rounded-lg hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-black px-8 py-4 text-lg font-bold rounded-lg hover:bg-gold-600 transition-all"
              >
                View Workspaces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="min-h-screen flex items-center bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-4">
              What We Do
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Technology, capital, and strategic execution for real estate and business opportunities that strengthen Minnesota&apos;s economic foundation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Development</h3>
              <p className="text-gray-700 leading-relaxed">
                Transform underutilized assets into strategic developments that drive economic growth and create lasting value for communities across Minnesota.
              </p>
            </div>

            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Acquisition</h3>
              <p className="text-gray-700 leading-relaxed">
                Leverage advanced analytics and market intelligence to identify and execute on high-value real estate and business acquisitions with precision and efficiency.
              </p>
            </div>

            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                Combine technology infrastructure, capital deployment, and strategic execution to build sustainable business models that strengthen Minnesota&apos;s economic ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="min-h-screen flex items-center bg-black text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-medium tracking-[-0.105em] mb-8 font-libre-baskerville italic">
              For the Love of Minnesota
            </h2>
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 leading-relaxed">
              Every business we develop, every asset we acquire, and every community we support is part of our commitment to making Minnesota a better place to live, work, and invest.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-black text-gold-400 mb-2">Growth</div>
                <p className="text-gray-300">Building sustainable businesses that strengthen our economic foundation</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-black text-gold-400 mb-2">Impact</div>
                <p className="text-gray-300">Creating value that benefits communities and investors alike</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-black text-gold-400 mb-2">Vision</div>
                <p className="text-gray-300">Transforming opportunities into lasting contributions to Minnesota</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center bg-gold-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-6">
              Ready to Build with Us?
            </h2>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed">
              Join us in transforming Minnesota&apos;s real estate landscape through technology, strategy, and community-focused development.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-lg font-bold rounded-lg hover:bg-gray-900 transition-all shadow-lg"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-black px-8 py-4 text-lg font-bold rounded-lg hover:bg-gold-600 transition-all"
              >
                Explore Workspaces
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
