'use client';

import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from '../layout';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';

export default function CreditProfilePage() {
  const { profile } = useCreditDashboard();

  if (!profile) {
    return null;
  }

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
              { label: 'Credit App', href: '/credit/app' },
              { label: 'Profile Status' },
            ]}
          />
          <h1 className="text-3xl font-bold text-black mb-6">Profile Status</h1>
          
          <div className="bg-white border-2 border-gold-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-semibold text-black">
                  {profile.firstName} {profile.middleName} {profile.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
                <p className="font-semibold text-black">{profile.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-black">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold text-black">{profile.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gold-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Current Address</h2>
            <p className="text-black">
              {profile.address.street}<br />
              {profile.address.city}, {profile.address.state} {profile.address.zipCode}
            </p>
          </div>

          {profile.previousAddresses && profile.previousAddresses.length > 0 && (
            <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-black mb-4">Previous Addresses</h2>
              <div className="space-y-4">
                {profile.previousAddresses.map((addr, idx) => (
                  <div key={idx} className="pb-4 border-b border-gold-200 last:border-0">
                    <p className="text-black">
                      {addr.street}<br />
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    {addr.yearsAtAddress && (
                      <p className="text-sm text-gray-600 mt-1">
                        {addr.yearsAtAddress} years
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

