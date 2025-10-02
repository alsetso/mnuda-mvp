'use client';

import LeadForm from '@/components/LeadForm';
import AppHeader from '@/features/session/components/AppHeader';

export default function LoanPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader 
        currentSession={null}
        sessions={[]}
        onNewSession={() => ({ id: '', name: '', createdAt: Date.now(), lastAccessed: Date.now(), nodes: [], locationTrackingActive: false })}
        onSessionSwitch={() => {}}
        showSessionSelector={false}
        showMobileToggle={false}
        showSidebarToggle={false}
        showSkipTraceToggle={false}
      />
      <LeadForm 
        type="loan"
        title="Get Pre-Approved or Refinance in Minnesota"
        subtitle="Secure the best mortgage rates and financing options for your Minnesota property"
      />
    </div>
  );
}
