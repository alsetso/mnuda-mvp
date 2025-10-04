'use client';

import { useApiUsageContext } from '../contexts/ApiUsageContext';
import RanOutOfCreditsModal from './RanOutOfCreditsModal';

export default function CreditsModalWrapper() {
  const { 
    isCreditsModalOpen, 
    hideCreditsModal, 
    apiUsage
  } = useApiUsageContext();

  return (
    <RanOutOfCreditsModal
      isOpen={isCreditsModalOpen}
      onClose={hideCreditsModal}
      creditsRemaining={apiUsage?.creditsRemaining || 0}
      totalCredits={apiUsage?.totalCredits || 10}
      creditsUsed={apiUsage?.creditsUsed || 10}
    />
  );
}
