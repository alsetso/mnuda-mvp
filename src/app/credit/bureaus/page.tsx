'use client';

import PageLayout from '@/components/PageLayout';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';
import { EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const bureaus = [
  {
    id: 'experian',
    name: 'Experian',
    fullName: 'Experian',
    address: {
      street: 'P.O. Box 4500',
      city: 'Allen',
      state: 'TX',
      zip: '75013',
    },
    website: 'https://www.experian.com',
    color: 'bg-blue-500',
  },
  {
    id: 'equifax',
    name: 'Equifax',
    fullName: 'Equifax Information Services LLC',
    address: {
      street: 'P.O. Box 740256',
      city: 'Atlanta',
      state: 'GA',
      zip: '30374-0256',
    },
    website: 'https://www.equifax.com',
    color: 'bg-green-500',
  },
  {
    id: 'transunion',
    name: 'TransUnion',
    fullName: 'TransUnion Consumer Solutions',
    address: {
      street: 'P.O. Box 2000',
      city: 'Chester',
      state: 'PA',
      zip: '19016-2000',
    },
    website: 'https://www.transunion.com',
    color: 'bg-purple-500',
  },
];

export default function CreditBureausPage() {
  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <CreditBreadcrumbs
            items={[
              { label: 'Credit', href: '/credit' },
              { label: 'Credit Bureaus' },
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Credit Bureaus</h1>
            <p className="text-lg text-gray-700">
              Contact information for the three major credit bureaus
            </p>
          </div>

          {/* Bureaus Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bureaus.map((bureau) => (
              <div
                key={bureau.id}
                className="bg-white border-2 border-gold-200 rounded-xl p-6 hover:border-gold-500 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`${bureau.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-lg">
                      {bureau.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black">{bureau.name}</h2>
                    <p className="text-sm text-gray-600">{bureau.fullName}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <div className="flex items-start gap-2 mb-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Mailing Address</p>
                      <div className="text-gray-700 leading-relaxed">
                        <p>{bureau.address.street}</p>
                        <p>
                          {bureau.address.city}, {bureau.address.state} {bureau.address.zip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <a
                    href={bureau.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <GlobeAltIcon className="w-5 h-5" />
                    <span>Visit Website</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-8 bg-white border-2 border-gold-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Important Notes</h2>
            <div className="prose prose-lg max-w-none">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Use these addresses when sending dispute letters via mail</li>
                <li>Include your full name, date of birth, and Social Security Number</li>
                <li>Send disputes via certified mail with return receipt requested</li>
                <li>Keep copies of all correspondence for your records</li>
                <li>Each bureau maintains its own credit report, so you may need to dispute items with each one separately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

