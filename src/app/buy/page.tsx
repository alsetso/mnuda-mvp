'use client';

import LeadForm from '@/components/LeadForm';
import AppHeader from '@/features/session/components/AppHeader';

export default function BuyPage() {
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
        type="buy"
        title="Find Your Dream Home in Minnesota"
        subtitle="Connect with top Minnesota real estate agents and find the perfect property for your needs"
      />
    </div>
  );
}
