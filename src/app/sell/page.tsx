'use client';

import LeadForm from '@/components/LeadForm';
import AppHeader from '@/features/session/components/AppHeader';

export default function SellPage() {
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
        type="sell"
        title="Sell Your Minnesota Property Fast"
        subtitle="Get expert help selling your Minnesota property with maximum value and minimum hassle"
      />
    </div>
  );
}
