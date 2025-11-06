'use client';

import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowRightIcon, BuildingOffice2Icon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function AboutPageClient() {
  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.105em] text-black mb-6 leading-tight font-libre-baskerville italic">
            For the Love of
            <span className="block text-gold-600 mt-2">Minnesota</span>
          </h1>
          <div className="mb-8">
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              <strong className="text-black">MNUDA</strong> — Minnesota Under Dev & Acq
            </p>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              We combine technology, capital, and strategy to acquire and develop high-value real estate and business opportunities that strengthen our state&apos;s economic foundation.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-6">
              Our Mission
            </h2>
            <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              Every business we develop, every asset we acquire, and every community we support is part of our commitment to making Minnesota a better place to live, work, and invest.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 lg:py-24 bg-gold-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-4">
              What We Do
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Development</h3>
              <p className="text-gray-700 leading-relaxed">
                Transform underutilized assets into strategic developments that drive economic growth and create lasting value for communities across Minnesota.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Acquisition</h3>
              <p className="text-gray-700 leading-relaxed">
                Leverage advanced analytics and market intelligence to identify and execute on high-value real estate and business acquisitions with precision and efficiency.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gold-200">
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

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Join Our Network
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Connect with Minnesota&apos;s real estate investment community and discover new opportunities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-gold-500 text-black px-8 py-4 text-lg font-bold rounded-lg hover:bg-gold-600 transition-all"
            >
              Get Started
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
