'use client';

import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from './layout';
import { 
  UserCircleIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

export default function CreditDashboardLandingPage() {
  const router = useRouter();
  const { profile, reports, negatives, letters } = useCreditDashboard();

  const navigationCards = [
    {
      id: 'profile',
      title: 'Profile Status',
      description: 'View and manage your credit profile information',
      icon: UserCircleIcon,
      count: null,
      href: '/account/credit/app/profile',
      color: 'bg-blue-500',
    },
    {
      id: 'reports',
      title: 'Credit Reports',
      description: `View and manage your ${reports.length} credit report${reports.length !== 1 ? 's' : ''}`,
      icon: DocumentTextIcon,
      count: reports.length,
      href: '/account/credit/app/reports',
      color: 'bg-green-500',
    },
    {
      id: 'negatives',
      title: 'Negative Items',
      description: `Track and dispute ${negatives.length} negative item${negatives.length !== 1 ? 's' : ''} on your credit`,
      icon: ExclamationTriangleIcon,
      count: negatives.length,
      href: '/account/credit/app/negatives',
      color: 'bg-red-500',
    },
    {
      id: 'letters',
      title: 'Credit Letters',
      description: `Manage ${letters.length} letter${letters.length !== 1 ? 's' : ''} sent to credit bureaus`,
      icon: EnvelopeIcon,
      count: letters.length,
      href: '/account/credit/app/letters',
      color: 'bg-purple-500',
    },
  ];

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="">
      <div className="min-h-screen bg-gold-100">
        {/* Hero Section - Flush to edges, dark background */}
        <div className="bg-black text-white py-16 w-full">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">Credit Dashboard</h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Manage your credit restoration journey. Track reports, dispute negative items, and monitor your progress.
              </p>
              {profile && (
                <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
                  <div className={`w-3 h-3 rounded-full ${
                    profile.status === 'active' ? 'bg-green-500' : 
                    profile.status === 'inactive' ? 'bg-yellow-500' : 
                    'bg-gray-400'
                  }`}></div>
                  <span className="font-semibold capitalize text-white">{profile.status} Profile</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navigationCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => router.push(card.href)}
                  className="bg-white border-2 border-gold-200 rounded-xl p-6 text-left hover:border-gold-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${card.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {card.count !== null && (
                      <span className="px-3 py-1 bg-gold-100 text-black font-semibold rounded-full text-sm">
                        {card.count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Quick Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Reports</p>
                <p className="text-3xl font-bold text-black">{reports.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Negative Items</p>
                <p className="text-3xl font-bold text-black">{negatives.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Letters Tracked</p>
                <p className="text-3xl font-bold text-black">{letters.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
