'use client';

import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from '../layout';
import { NegativeItemsPanel } from '@/features/credit/components/NegativeItemsPanel';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';

export default function CreditNegativesPage() {
  const { profile, negatives, isLoadingNegatives, refreshNegatives } = useCreditDashboard();

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
      <div className="min-h-screen bg-gold-100 overflow-hidden" style={{ height: 'calc(100vh - 3rem)' }}>
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <CreditBreadcrumbs
              items={[
                { label: 'Credit App', href: '/credit/app' },
                { label: 'Negative Items' },
              ]}
            />
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <NegativeItemsPanel
              items={negatives}
              isLoading={isLoadingNegatives}
              onRefresh={refreshNegatives}
              creditProfileId={profile.id}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

