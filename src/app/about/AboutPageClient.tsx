'use client';

import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowRightIcon, BuildingOffice2Icon, ChartBarIcon, LightBulbIcon, HeartIcon } from '@heroicons/react/24/outline';

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
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            Minnesota&apos;s first organized network of real estate investors, professionals, and developers working together to identify, acquire, and redevelop high-value opportunities.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-6 text-center">
              Our Mission
            </h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                MNUDA (Minnesota Under Distress and Acquisition) represents a collaborative approach to real estate investment in Minnesota. We combine technology, capital, and strategic execution to transform distressed properties into valuable assets that strengthen our state&apos;s economic foundation.
              </p>
              <p>
                Every business we develop, every asset we acquire, and every community we support is part of our commitment to making Minnesota a better place to live, work, and invest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 bg-gold-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <HeartIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Community First</h3>
              <p className="text-gray-700 leading-relaxed">
                We believe in building sustainable businesses that create value for communities, investors, and stakeholders alike.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Data-Driven</h3>
              <p className="text-gray-700 leading-relaxed">
                We leverage advanced analytics and market intelligence to make informed decisions and identify high-value opportunities.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Innovation</h3>
              <p className="text-gray-700 leading-relaxed">
                We combine cutting-edge technology with proven real estate expertise to transform opportunities into lasting value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-black mb-4">
              What We Do
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Technology, capital, and strategic execution for real estate and business opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Development</h3>
              <p className="text-gray-700 leading-relaxed">
                Transform underutilized assets into strategic developments that drive economic growth and create lasting value for communities across Minnesota.
              </p>
            </div>

            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-4">Acquisition</h3>
              <p className="text-gray-700 leading-relaxed">
                Leverage advanced analytics and market intelligence to identify and execute on high-value real estate and business acquisitions with precision and efficiency.
              </p>
            </div>

            <div className="bg-gold-100 rounded-xl p-8 border border-gold-200">
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
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 text-lg font-bold rounded-lg hover:bg-white/10 transition-all"
            >
              View Workspaces
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

