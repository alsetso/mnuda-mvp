'use client';

import { useApiUsageContext } from '../contexts/ApiUsageContext';
import RanOutOfCreditsModal from './RanOutOfCreditsModal';

export default function CreditsModalWrapper() {
  const { 
    isCreditsModalOpen, 
    hideCreditsModal, 
    creditsRemaining 
  } = useApiUsageContext();

  return (
    <RanOutOfCreditsModal
      isOpen={isCreditsModalOpen}
      onClose={hideCreditsModal}
      creditsRemaining={creditsRemaining}
    />
  );
}
