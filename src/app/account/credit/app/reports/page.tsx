'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from '../layout';
import { CreditReportUpload } from '@/features/credit/components/CreditReportUpload';
import { CreditReportCard } from '@/features/credit/components/CreditReportCard';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function CreditReportsPage() {
  const { profile, reports, refreshReports } = useCreditDashboard();
  const [showUpload, setShowUpload] = useState(false);

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
                { label: 'Credit App', href: '/account/credit/app' },
              { label: 'Credit Reports' },
            ]}
          />
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-black">Credit Reports</h1>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              {showUpload ? 'Cancel' : 'Upload Report'}
            </button>
          </div>
          
          {showUpload && (
            <div className="mb-6">
              <CreditReportUpload 
                creditProfileId={profile.id} 
                onUploadComplete={() => {
                  refreshReports();
                  setShowUpload(false);
                }}
              />
            </div>
          )}
          
          {reports.length === 0 ? (
            <div className="bg-white border-2 border-gold-200 rounded-xl p-12 text-center">
              <p className="text-gray-600 text-lg">No credit reports uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <CreditReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

