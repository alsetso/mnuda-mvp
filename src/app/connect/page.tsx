'use client';

import LeadForm from '@/components/LeadForm';
import AppHeader from '@/features/session/components/AppHeader';

export default function ConnectPage() {
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
        title="Connect with a Minnesota Real Estate Agent"
        subtitle="Get personalized help finding your dream home with expert guidance from local Minnesota agents"
      />
    </div>
  );
}
